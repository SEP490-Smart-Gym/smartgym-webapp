import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box, Stepper, Step, StepLabel, Card, CardContent, CardMedia, Typography,
  IconButton, TextField, Button, Stack, Grid, Divider, Paper, useTheme, styled,
  Container, CircularProgress, Snackbar, Alert, Chip, Tooltip
} from "@mui/material";
import {
  FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiCreditCard,
  FiArrowLeft, FiArrowRight, FiLock, FiClock
} from "react-icons/fi";

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: "all 0.3s ease",
  borderRadius: theme.spacing(2),
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
}));

const CheckoutSteps = ({ activeStep, steps }) => (
  <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
    {steps.map((label) => (
      <Step key={label}>
        <StepLabel>{label}</StepLabel>
      </Step>
    ))}
  </Stepper>
);

const PaymentForm = () => (
  <Stack spacing={3}>
    <TextField label="Card Number" fullWidth placeholder="1234 5678 9012 3456" />
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField label="Expiry Date" fullWidth placeholder="MM/YY" />
      </Grid>
      <Grid item xs={6}>
        <TextField label="CVV" fullWidth placeholder="123" type="password" />
      </Grid>
    </Grid>
    <TextField label="Name on Card" fullWidth />
  </Stack>
);

// ====== Helpers: tạo slot 1 giờ từ 05:00–21:00 (last slot 20:00–21:00) ======
const toHHMM = (n) => String(n).padStart(2, "0") + ":00";
const buildHourlySlots = (startHour = 5, endHour = 21) => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const from = `${toHHMM(h)}`;
    const to = `${toHHMM(h + 1)}`;
    slots.push(`${from}-${to}`);
  }
  return slots;
};

// ====== Mock trainers (unavailable: slot đã có 1 member khác) ======
const TRAINERS = [
  {
    id: "t1",
    name: "Trần Thảo My",
    avatar: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800&auto=format&fit=crop",
    specialties: ["Fat Loss", "Strength"],
    unavailable: ["07:00-08:00"]
  },
  {
    id: "t2",
    name: "Nguyễn Minh Khoa",
    avatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800&auto=format&fit=crop",
    specialties: ["Mobility", "Beginner"],
    unavailable: ["17:00-18:00"]
  },
  {
    id: "t3",
    name: "Phạm Hoàng Long",
    avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
    specialties: ["Hypertrophy", "Powerlifting"],
    unavailable: []
  }
];

const SlotButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: "none",
  fontWeight: 600
}));

const CartComponent = () => {
  const theme = useTheme();
  const SINGLE_SERVICE = true;

  // Chỉ 1 dịch vụ trong giỏ
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Gói Tập Gym 3 Tháng",
      price: 199.0,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1",
      stock: 1
    },
    {
      id: 2,
      name: "Gói PT 10 Buổi",
      price: 299.0,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
      stock: 1
    }
  ]);

  useEffect(() => {
    if (SINGLE_SERVICE && cartItems.length > 1) {
      setCartItems([{ ...cartItems[0], quantity: 1 }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bước: Cart (0) → Slot (1) → Trainer (2) → Payment (3) → Confirmation (4)
  const steps = ["Cart", "Slot", "Trainer", "Payment", "Confirmation"];
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [discount, setDiscount] = useState(0);

  // Booking states
  const slots = useMemo(() => buildHourlySlots(5, 21), []);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Trainer states
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [userTouchedTrainer, setUserTouchedTrainer] = useState(false); // user đã tự chọn trainer?
  const [suggestedTrainer, setSuggestedTrainer] = useState(null);      // trainer gợi ý luôn hiển thị

  // Một slot bị disable nếu TẤT CẢ trainer đều bận ở slot đó
  const isSlotDisabled = (slot) => TRAINERS.every(t => t.unavailable.includes(slot));

  // ====== Auto-suggest Trainer ======
  const getSuggestedTrainerForSlot = useCallback((slot) => {
    if (!slot) return null;
    // ưu tiên trainer available đầu tiên theo thứ tự danh sách
    const candidate = TRAINERS.find(t => !t.unavailable.includes(slot));
    return candidate || null;
  }, []);

  const getSuggestedTrainerGlobal = useCallback(() => {
    // chọn trainer “phù hợp nhất toàn cục” = ít giờ bận nhất
    const sorted = [...TRAINERS].sort((a, b) => a.unavailable.length - b.unavailable.length);
    return sorted[0] || null;
  }, []);

  // Auto-suggest & auto-select nếu user chưa chọn tay
  useEffect(() => {
    if (selectedSlot) {
      const suggested = getSuggestedTrainerForSlot(selectedSlot);
      setSuggestedTrainer(suggested);

      const stillOk = selectedTrainer && !selectedTrainer.unavailable.includes(selectedSlot);
      if (!stillOk) {
        setSelectedTrainer(suggested || null);   // mặc định chọn gợi ý
        setUserTouchedTrainer(false);
      }
    } else {
      const globalSg = getSuggestedTrainerGlobal();
      setSuggestedTrainer(globalSg);
      if (!userTouchedTrainer) {
        setSelectedTrainer(globalSg);            // mặc định chọn gợi ý toàn cục
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot]);

  // ======== Navigation guards =========
  const canProceedFromSlot = !!selectedSlot;
  const canProceedFromTrainer = !!selectedTrainer;

  const guardedNext = () => {
    // Bước Slot: phải chọn slot
    if (activeStep === 1 && !canProceedFromSlot) {
      return setSnackbar({ open: true, message: "Vui lòng chọn khung giờ trước.", severity: "warning" });
    }
    // Bước Trainer: nếu user chưa chọn → auto chọn gợi ý trước khi đi tiếp
    if (activeStep === 2 && !selectedTrainer && suggestedTrainer) {
      setSelectedTrainer(suggestedTrainer);
      setUserTouchedTrainer(false);
    }
    if (activeStep === 2 && !canProceedFromTrainer) {
      return setSnackbar({ open: true, message: "Vui lòng chọn trainer.", severity: "warning" });
    }

    setLoading(true);
    setTimeout(() => {
      setActiveStep((prev) => prev + 1);
      setLoading(false);
      setSnackbar({ open: true, message: "Step completed successfully!", severity: "success" });
    }, 800);
  };

  const handleNext = guardedNext;
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleQuantityChange = useCallback((id, newQuantity) => {
    if (SINGLE_SERVICE) {
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: 1 } : item))
      );
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.min(Math.max(1, newQuantity), item.stock) }
          : item
      )
    );
  }, [SINGLE_SERVICE]);

  const handleRemoveItem = useCallback((id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const calculateSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  const total = Math.max(0, calculateSubtotal - discount);

  const handlePromoCode = () => {
    const validPromo = "SAVE20";
    if (promoCode.toUpperCase() === validPromo) {
      setDiscount(calculateSubtotal * 0.2);
      setPromoError("");
      setSnackbar({ open: true, message: "Promo code applied successfully!", severity: "success" });
    } else {
      setDiscount(0);
      setPromoError("Invalid promo code");
      setSnackbar({ open: true, message: "Invalid promo code", severity: "error" });
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      // 0. Cart
      case 0:
        return (
          <Grid container spacing={3} justifyContent="center" alignItems="flex-start" sx={{ mt: 2 }}>
            <Grid item xs={12} md={8}>
              {cartItems.length === 0 && (
                <StyledPaper>
                  <Typography align="center" color="text.secondary">
                    Giỏ hàng đang trống.
                  </Typography>
                </StyledPaper>
              )}

              {cartItems.map((item) => (
                <StyledCard key={item.id}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={3}>
                        <CardMedia
                          component="img"
                          height="100"
                          image={item.image}
                          alt={item.name}
                          sx={{ objectFit: "cover", borderRadius: 2 }}
                        />
                      </Grid>
                      <Grid item xs={9}>
                        <Stack spacing={1}>
                          <Typography variant="h6">{item.name}</Typography>
                          <Typography variant="body1" color="text.secondary">
                            ${item.price.toFixed(2)}
                          </Typography>

                          <Stack direction="row" spacing={1} alignItems="center">
                            <IconButton color="error" onClick={() => handleRemoveItem(item.id)}>
                              <FiTrash2 />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </StyledCard>
              ))}
            </Grid>

            <Grid item xs={12} md={4}>
              <StyledPaper>
                <Stack spacing={2}>
                  <Typography variant="h6">Order Summary</Typography>
                  {discount > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Discount</Typography>
                      <Typography color="error">-${discount.toFixed(2)}</Typography>
                    </Stack>
                  )}
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6">Total</Typography>
                    <Typography variant="h6">${total.toFixed(2)}</Typography>
                  </Stack>
                  <TextField
                    label="Promo Code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    error={Boolean(promoError)}
                    helperText={promoError}
                    fullWidth
                  />
                  <Button variant="outlined" onClick={handlePromoCode}>
                    Apply Promo
                  </Button>
                </Stack>
              </StyledPaper>
            </Grid>
          </Grid>
        );

      // 1. Slot
      case 1:
        return (
          <Stack spacing={3}>
            <StyledPaper>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <FiClock />
                <Typography variant="h6">Chọn khung giờ (1 giờ/slot)</Typography>
              </Stack>

              <Grid container spacing={1.5}>
                {slots.map((slot) => {
                  const disabled = isSlotDisabled(slot);
                  const selected = selectedSlot === slot;
                  const freeCount = TRAINERS.filter(t => !t.unavailable.includes(slot)).length;
                  return (
                    <Grid item xs={6} sm={4} md={3} key={slot}>
                      <Tooltip title={disabled ? "Slot đầy: tất cả trainer bận" : `${freeCount} trainer rảnh`}>
                        <span>
                          <SlotButton
                            variant={selected ? "contained" : "outlined"}
                            onClick={() => !disabled && setSelectedSlot(slot)}
                            disabled={disabled}
                            fullWidth
                          >
                            {slot}
                          </SlotButton>
                        </span>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>

              {(selectedSlot || suggestedTrainer) && (
                <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  {selectedSlot && <Chip color="primary" label={`Đã chọn: ${selectedSlot}`} />}
                  {suggestedTrainer && (
                    <Chip
                      color="success"
                      variant="outlined"
                      label={`Gợi ý trainer: ${suggestedTrainer.name}`}
                    />
                  )}
                </Box>
              )}
            </StyledPaper>

            <Typography variant="body2" color="text.secondary">
              *Một ngày có thể đặt nhiều slot. Mỗi slot – mỗi trainer chỉ nhận tối đa 1 member.
            </Typography>
          </Stack>
        );

      // 2. Trainer (sort: available trước, busy sau)
      case 2:
        // Tạo bản sao đã sort để available lên trước
        const sortedTrainers = ([...TRAINERS].sort((a, b) => {
          const aAvail = selectedSlot ? !a.unavailable.includes(selectedSlot) : true;
          const bAvail = selectedSlot ? !b.unavailable.includes(selectedSlot) : true;
          return aAvail === bAvail ? 0 : aAvail ? -1 : 1;
        }));

        return (
          <Stack spacing={2}>
            <Typography variant="h6">Chọn Trainer</Typography>
            {!selectedSlot && (
              <Alert severity="info">
                Chưa chọn slot — hệ thống đã <strong>gợi ý</strong> một trainer phù hợp. Bạn vẫn có thể chọn lại.
              </Alert>
            )}

            <Grid container spacing={2}>
              {sortedTrainers.map((t) => {
                const available = selectedSlot ? !t.unavailable.includes(selectedSlot) : true;
                const selected = selectedTrainer?.id === t.id;
                const isSuggestedCard = suggestedTrainer?.id === t.id;

                return (
                  <Grid item xs={12} md={4} key={t.id}>
                    <StyledCard
                      onClick={() => {
                        if (!available) return; // 🚫 không cho chọn trainer bận
                        setSelectedTrainer(t);
                        setUserTouchedTrainer(true);
                      }}
                      sx={{
                        cursor: available ? "pointer" : "not-allowed",
                        outline: selected ? `2px solid ${theme.palette.primary.main}` : "none",
                        opacity: available ? 1 : 0.6
                      }}
                    >
                      <CardMedia component="img" height="160" image={t.avatar} alt={t.name} />
                      <CardContent>
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="h6" sx={{ flex: 1 }}>{t.name}</Typography>
                            <Chip
                              size="small"
                              label={selectedSlot ? (available ? "Available" : "Busy") : "Available"}
                              color={selectedSlot ? (available ? "success" : "default") : "success"}
                              variant={selectedSlot ? (available ? "filled" : "outlined") : "filled"}
                            />
                          </Stack>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {t.specialties.map((s) => (
                              <Chip key={s} size="small" variant="outlined" label={s} />
                            ))}
                          </Stack>
                          {/* Hàng badge trạng thái lựa chọn + đề xuất */}
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                            {selected && <Chip size="small" color="primary" label="Đã chọn" />}
                            {isSuggestedCard && (
                              <Chip size="small" color="secondary" variant="outlined" label="Đề xuất" />
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                );
              })}
            </Grid>

            {(selectedTrainer || suggestedTrainer) && (
              <Alert severity="success">
                {selectedTrainer ? (
                  <>Đã chọn: <strong>{selectedTrainer.name}</strong>{selectedSlot && <> — Slot <strong>{selectedSlot}</strong></>}</>
                ) : (
                  <>Gợi ý: <strong>{suggestedTrainer?.name}</strong></>
                )}
                {suggestedTrainer && selectedTrainer?.id !== suggestedTrainer.id && (
                  <> — Gợi ý hệ thống: <strong>{suggestedTrainer.name}</strong></>
                )}
              </Alert>
            )}
          </Stack>
        );

      // 3. Payment
      case 3:
        return (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Slot: <strong>{selectedSlot || "Chưa chọn"}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Trainer đã chọn: <strong>{selectedTrainer?.name || "—"}</strong>
              </Typography>
              {suggestedTrainer && selectedTrainer?.id !== suggestedTrainer.id && (
                <Typography variant="body2" color="text.secondary">
                  Gợi ý hệ thống: <strong>{suggestedTrainer.name}</strong>
                </Typography>
              )}
            </Stack>
            <PaymentForm />
          </StyledPaper>
        );

      // 4. Confirmation
      case 4:
        return (
          <StyledPaper>
            <Stack spacing={3} alignItems="center">
              <CircularProgress size={60} sx={{ color: "success.main" }} />
              <Typography variant="h5">Order Confirmed!</Typography>
              <Typography color="text.secondary" align="center">
                Cảm ơn bạn đã đặt lịch. Mã đơn #12345.
                Chúng tôi sẽ gửi email xác nhận và nhắc lịch trước buổi tập.
              </Typography>
              <Button
                variant="contained"
                startIcon={<FiShoppingBag />}
                onClick={() => {
                  setActiveStep(0);
                  setSelectedSlot(null);
                  setSelectedTrainer(null);
                  setSuggestedTrainer(null);
                  setUserTouchedTrainer(false);
                }}
              >
                Quay về Trang Chủ
              </Button>
            </Stack>
          </StyledPaper>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Checkout
      </Typography>

      {/* Bước: Cart → Slot → Trainer → Payment → Confirmation */}
      <CheckoutSteps activeStep={activeStep} steps={steps} />
      {renderStepContent(activeStep)}

      {/* Ẩn nút điều hướng trên màn hình Confirmation (index 4) */}
      {activeStep !== 4 && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            startIcon={<FiArrowLeft />}
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={activeStep === 3 ? <FiLock /> : <FiArrowRight />}
            onClick={handleNext}
            disabled={
              loading ||
              (activeStep === 0 && cartItems.length === 0) ||
              (activeStep === 1 && !selectedSlot) ||
              (activeStep === 1 && selectedSlot && isSlotDisabled(selectedSlot))
            }
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === 3 ? (
              "Place Order"
            ) : (
              "Continue"
            )}
          </Button>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CartComponent;
