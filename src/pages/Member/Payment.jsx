import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef
} from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  TextField,
  Button,
  Stack,
  Grid,
  Divider,
  Paper,
  useTheme,
  styled,
  Container,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Tooltip
} from "@mui/material";
import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShoppingBag,
  FiCreditCard,
  FiArrowLeft,
  FiArrowRight,
  FiLock,
  FiClock
} from "react-icons/fi";
import { useParams } from "react-router-dom";
import api from "../../config/axios";

// ============ CONSTANTS ============
// Publishable key dùng cho Stripe (như trong HTML test page)
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51SS4bPRq7GZWeiD8KPMbvTaHs21UB7LUYmSVcqyNtQ6RghCpQvmgUFMkTGzvsKbxKodpE7jEVmZVDXICO2gK3Yz100upoioxdl";

// ================== Styled ==================
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

const SlotButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: "none",
  fontWeight: 600
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

// ----- PaymentForm: giữ postalCode + notes, card dùng Stripe Elements -----
const PaymentForm = ({ paymentInfo, onChange }) => (
  <Stack spacing={3}>
    <TextField
      label="Ghi chú"
      fullWidth
      multiline
      minRows={2}
      value={paymentInfo.notes}
      onChange={(e) => onChange("notes", e.target.value)}
    />
  </Stack>
);

// ====== Helper format tiền VND: xx.xxx.xxx VND ======
const formatVND = (value) => {
  const number = Number(value) || 0;
  return `${Math.round(number).toLocaleString("vi-VN")} VND`;
};

// Fallback trainers nếu API lỗi (để UI không bị vỡ)
const FALLBACK_TRAINERS = [
  {
    id: "t1",
    name: "Trần Thảo My",
    avatar:
      "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800&auto=format&fit=crop",
    specialties: ["Fat Loss", "Strength"],
    unavailable: []
  },
  {
    id: "t2",
    name: "Nguyễn Minh Khoa",
    avatar:
      "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800&auto=format&fit=crop",
    specialties: ["Mobility", "Beginner"],
    unavailable: []
  },
  {
    id: "t3",
    name: "Phạm Hoàng Long",
    avatar:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
    specialties: ["Hypertrophy", "Powerlifting"],
    unavailable: []
  }
];

const CartComponent = () => {
  const theme = useTheme();
  const { id } = useParams(); // /checkout/:id
  const packageId = id || 1; // nếu không có id thì tạm dùng 1

  const SINGLE_SERVICE = true; // vẫn giữ logic chỉ 1 dịch vụ

  // ====== Cart / Package state (lấy từ API Package/active/:id) ======
  const [cartItems, setCartItems] = useState([]);
  const [packageLoading, setPackageLoading] = useState(false);

  // ====== Trainer state (lấy từ API guest/trainers) ======
  const [trainers, setTrainers] = useState(FALLBACK_TRAINERS);
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [trainerError, setTrainerError] = useState("");

  // ====== TimeSlot state (lấy từ API /TimeSlot) ======
  const [slots, setSlots] = useState([]); // mảng string kiểu "05:00-06:00"
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");

  // Bước: Cart (0) → Slot (1) → Trainer (2) → Payment (3) → Confirmation (4)
  const steps = ["Cart", "Slot", "Trainer", "Payment", "Confirmation"];
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [discount, setDiscount] = useState(0);

  // Booking states
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Trainer selection states
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [userTouchedTrainer, setUserTouchedTrainer] = useState(false); // user đã tự chọn trainer?
  const [suggestedTrainer, setSuggestedTrainer] = useState(null); // trainer gợi ý luôn hiển thị

  // ====== Payment states ======
  const [paymentInfo, setPaymentInfo] = useState({
    postalCode: "",
    notes: "",
    isAutoRenewal: true
  });

  const [paymentIntent, setPaymentIntent] = useState(null); // { id, clientSecret }
  const [paymentStatus, setPaymentStatus] = useState(null); // "success" | "failed" | null

  const handlePaymentFieldChange = (field, value) => {
    setPaymentInfo((prev) => ({ ...prev, [field]: value }));
  };

  // ====== Stripe Elements (từ HTML test) ======
  const [stripeState, setStripeState] = useState({
    stripe: null,
    elements: null
  });
  const [stripeCard, setStripeCard] = useState(null);
  const cardElementRef = useRef(null);

  // load script https://js.stripe.com/v3/ & init Stripe Elements khi vào step Payment
  useEffect(() => {
    if (activeStep !== 3) return;

    const initStripe = () => {
      if (stripeState.stripe || !window.Stripe) return;
      const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
      const elements = stripe.elements();
      const card = elements.create("card");
      if (cardElementRef.current) {
        card.mount(cardElementRef.current);
      }
      setStripeState({ stripe, elements });
      setStripeCard(card);
    };

    if (window.Stripe) {
      initStripe();
    } else {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      script.onload = initStripe;
      document.body.appendChild(script);
    }

    // cleanup nếu cần (unmount card khi rời step)
    return () => {
      if (stripeCard) {
        stripeCard.unmount();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  // ====== Fetch package from API ======
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setPackageLoading(true);
        const res = await api.get(`/Package/active/${packageId}`);
        const pkg = res.data;

        const mappedItem = {
          id: pkg.id,
          name: pkg.packageName,
          price: pkg.price || 0,
          quantity: 1,
          // tạm dùng ảnh đại diện chung; có thể thay bằng field từ API nếu sau này có
          image:
            "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=800&q=80",
          stock: 1
        };

        setCartItems([mappedItem]);
      } catch (error) {
        console.error("Error fetching package:", error);
        setSnackbar({
          open: true,
          message: "Không tải được gói tập. Vui lòng thử lại.",
          severity: "error"
        });
      } finally {
        setPackageLoading(false);
      }
    };

    fetchPackage();
  }, [packageId]);

  // ====== Fetch trainers from API ======
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setTrainerLoading(true);
        setTrainerError("");
        const res = await api.get("/guest/trainers");
        const data = Array.isArray(res.data) ? res.data : [];

        const mapped = data
          .filter((t) => t.isAvailableForNewClients !== false) // chỉ lấy trainer còn nhận khách
          .map((t) => ({
            id: t.trainerId,
            name: `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Trainer",
            avatar:
              "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=800&q=80",
            specialties: t.specialization
              ? t.specialization.split(",").map((s) => s.trim())
              : [],
            // hiện tại API chưa trả slot bận theo giờ, tạm cho tất cả rảnh
            unavailable: []
          }));

        if (mapped.length > 0) {
          setTrainers(mapped);
        }
      } catch (error) {
        console.error("Error fetching trainers:", error);
        setTrainerError(
          "Không tải được danh sách huấn luyện viên. Đang dùng dữ liệu mặc định."
        );
        setSnackbar({
          open: true,
          message: "Không tải được danh sách trainer, đang dùng dữ liệu mẫu.",
          severity: "warning"
        });
        // nếu lỗi sẽ dùng FALLBACK_TRAINERS đã set mặc định
      } finally {
        setTrainerLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  // ====== Fetch TimeSlots from API /TimeSlot ======
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        setSlotLoading(true);
        setSlotError("");
        const res = await api.get("/TimeSlot");
        const data = Array.isArray(res.data) ? res.data : [];

        // Cố gắng map linh hoạt: ưu tiên field có sẵn, fallback ghép start-end
        const mappedSlots = data
          .map((ts) => {
            if (ts.timeRange) return ts.timeRange; // ví dụ "05:00-06:00"
            if (ts.slotName) return ts.slotName;
            const start =
              ts.startTime?.slice(0, 5) || ts.start?.slice(0, 5) || null;
            const end =
              ts.endTime?.slice(0, 5) || ts.end?.slice(0, 5) || null;
            if (start && end) return `${start}-${end}`;
            return null;
          })
          .filter(Boolean);

        setSlots(mappedSlots);
      } catch (error) {
        console.error("Error fetching time slots:", error);
        setSlotError("Không tải được danh sách khung giờ.");
        setSnackbar({
          open: true,
          message: "Không tải được danh sách khung giờ.",
          severity: "error"
        });
        setSlots([]); // không có slot → user không chọn được
      } finally {
        setSlotLoading(false);
      }
    };

    fetchTimeSlots();
  }, []);

  // Một slot bị disable nếu TẤT CẢ trainer đều bận ở slot đó
  const isSlotDisabled = (slot) =>
    trainers.length > 0 && trainers.every((t) => t.unavailable.includes(slot));

  // ====== Auto-suggest Trainer (dùng trainers từ API) ======
  const getSuggestedTrainerForSlot = useCallback(
    (slot) => {
      if (!slot || trainers.length === 0) return null;
      // ưu tiên trainer available đầu tiên theo thứ tự danh sách
      const candidate = trainers.find((t) => !t.unavailable.includes(slot));
      return candidate || null;
    },
    [trainers]
  );

  const getSuggestedTrainerGlobal = useCallback(() => {
    if (trainers.length === 0) return null;
    // chọn trainer “phù hợp nhất toàn cục” = ít giờ bận nhất
    const sorted = [...trainers].sort(
      (a, b) => (a.unavailable?.length || 0) - (b.unavailable?.length || 0)
    );
    return sorted[0] || null;
  }, [trainers]);

  // Auto-suggest & auto-select nếu user chưa chọn tay
  useEffect(() => {
    if (selectedSlot) {
      const suggested = getSuggestedTrainerForSlot(selectedSlot);
      setSuggestedTrainer(suggested);

      const stillOk =
        selectedTrainer && !selectedTrainer.unavailable.includes(selectedSlot);
      if (!stillOk) {
        setSelectedTrainer(suggested || null); // mặc định chọn gợi ý
        setUserTouchedTrainer(false);
      }
    } else {
      const globalSg = getSuggestedTrainerGlobal();
      setSuggestedTrainer(globalSg);
      if (!userTouchedTrainer) {
        setSelectedTrainer(globalSg); // mặc định chọn gợi ý toàn cục
      }
    }
  }, [
    selectedSlot,
    getSuggestedTrainerForSlot,
    getSuggestedTrainerGlobal,
    selectedTrainer,
    userTouchedTrainer
  ]);

  // ======== Navigation guards =========
  const canProceedFromSlot = !!selectedSlot;
  const canProceedFromTrainer = !!selectedTrainer;

  // ======== PAYMENT HANDLER (Stripe + confirm-payment) =========
  const handlePaymentSubmit = async () => {
    if (!stripeState.stripe || !stripeCard) {
      setSnackbar({
        open: true,
        message:
          "Đang khởi tạo form thanh toán Stripe, vui lòng thử lại sau vài giây.",
        severity: "warning"
      });
      return;
    }

    if (!selectedTrainer || !selectedSlot || cartItems.length === 0) {
      setSnackbar({
        open: true,
        message: "Thiếu thông tin slot/trainer/gói tập.",
        severity: "error"
      });
      return;
    }

    try {
      setLoading(true);
      setSnackbar({
        open: true,
        message: "Đang tạo payment intent...",
        severity: "info"
      });

      const pkg = cartItems[0];

      // startDate: tạm dùng thời điểm hiện tại (sau này gắn với ngày + slot nếu có)
      const startDateISO = new Date().toISOString();

      // 1. Tạo payment intent
      const createBody = {
        packageId: pkg.id,
        trainerId: selectedTrainer.id,
        startDate: startDateISO,
        isAutoRenewal: paymentInfo.isAutoRenewal,
        discountCode: promoCode || "",
        notes: paymentInfo.notes || ""
      };

      const createRes = await api.post(
        "/Payment/create-payment-intent",
        createBody
      );

      const {
        clientSecret,
        paymentIntentId,
        amount,
        discountAmount,
        finalAmount,
        currency,
        pendingMemberPackageId,
        pendingPaymentId
      } = createRes.data;

      if (!clientSecret || !paymentIntentId) {
        throw new Error("Thiếu clientSecret hoặc paymentIntentId từ API.");
      }

      setPaymentIntent({ id: paymentIntentId, clientSecret });

      // 2. Confirm với Stripe (logic giống HTML test page)
      setSnackbar({
        open: true,
        message: "Đang xác nhận thanh toán với Stripe...",
        severity: "info"
      });

      const result = await stripeState.stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: stripeCard,
            billing_details: {
              // có thể gắn postalCode vào đây nếu muốn
              address: {
                postal_code: paymentInfo.postalCode || undefined
              }
            }
          }
        }
      );

      if (result.error) {
        console.error("Stripe error:", result.error);
        setPaymentStatus("failed");
        setActiveStep(4);
        setSnackbar({
          open: true,
          message: "Stripe error: " + result.error.message,
          severity: "error"
        });
        return;
      }

      const stripePI = result.paymentIntent;
      console.log("Stripe status:", stripePI.status, stripePI.id);

      if (stripePI.status !== "succeeded") {
        setPaymentStatus("failed");
        setActiveStep(4);
        setSnackbar({
          open: true,
          message:
            "Thanh toán chưa thành công (trạng thái: " +
            stripePI.status +
            ").",
          severity: "error"
        });
        return;
      }

      // 3. Gọi confirm-payment trên backend để kích hoạt gói
      setSnackbar({
        open: true,
        message: "Đang xác nhận thanh toán với hệ thống...",
        severity: "info"
      });

      const confirmRes = await api.post("/Payment/confirm-payment", {
        paymentIntentId: stripePI.id
      });

      // tuỳ response của backend, ở đây coi 200 là OK
      if (confirmRes.status === 200) {
        setPaymentStatus("success");
        setSnackbar({
          open: true,
          message: "Thanh toán thành công! Gói tập đã được kích hoạt.",
          severity: "success"
        });
      } else {
        setPaymentStatus("failed");
        setSnackbar({
          open: true,
          message:
            "Thanh toán Stripe thành công nhưng xác nhận với hệ thống thất bại.",
          severity: "error"
        });
      }

      setActiveStep(4); // sang Confirmation
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("failed");
      setActiveStep(4);
      setSnackbar({
        open: true,
        message: "Có lỗi khi xử lý thanh toán. Vui lòng thử lại.",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const guardedNext = () => {
    // Bước Slot: phải chọn slot
    if (activeStep === 1 && !canProceedFromSlot) {
      return setSnackbar({
        open: true,
        message: "Vui lòng chọn khung giờ trước.",
        severity: "warning"
      });
    }
    // Bước Trainer: nếu user chưa chọn → auto chọn gợi ý trước khi đi tiếp
    if (activeStep === 2 && !selectedTrainer && suggestedTrainer) {
      setSelectedTrainer(suggestedTrainer);
      setUserTouchedTrainer(false);
    }
    if (activeStep === 2 && !canProceedFromTrainer) {
      return setSnackbar({
        open: true,
        message: "Vui lòng chọn trainer.",
        severity: "warning"
      });
    }

    // Bước Payment: chạy flow thanh toán thật (Stripe + confirm-payment)
    if (activeStep === 3) {
      return handlePaymentSubmit();
    }

    // Các bước khác: giữ logic cũ
    setLoading(true);
    setTimeout(() => {
      setActiveStep((prev) => prev + 1);
      setLoading(false);
      setSnackbar({
        open: true,
        message: "Step completed successfully!",
        severity: "success"
      });
    }, 800);
  };

  const handleNext = guardedNext;
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleQuantityChange = useCallback(
    (id, newQuantity) => {
      if (SINGLE_SERVICE) {
        setCartItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, quantity: 1 } : item))
        );
        return;
      }
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.min(Math.max(1, newQuantity), item.stock)
              }
            : item
        )
      );
    },
    [SINGLE_SERVICE]
  );

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
      setSnackbar({
        open: true,
        message: "Promo code applied successfully!",
        severity: "success"
      });
    } else {
      setDiscount(0);
      setPromoError("Invalid promo code");
      setSnackbar({
        open: true,
        message: "Invalid promo code",
        severity: "error"
      });
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      // 0. Cart
      case 0:
        return (
          <Grid
            container
            spacing={3}
            justifyContent="center"
            alignItems="flex-start"
            sx={{ mt: 2 }}
          >
            <Grid item xs={12} md={8}>
              {packageLoading && (
                <StyledPaper>
                  <Typography align="center" color="text.secondary">
                    Đang tải gói tập...
                  </Typography>
                </StyledPaper>
              )}

              {!packageLoading && cartItems.length === 0 && (
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
                            {formatVND(item.price)}
                          </Typography>

                          <Stack direction="row" spacing={1}>
                            {/* Nếu sau này cho phép tăng số lượng, có thể dùng FiMinus/FiPlus */}
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveItem(item.id)}
                            >
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
                      <Typography color="error">
                        - {formatVND(discount)}
                      </Typography>
                    </Stack>
                  )}
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6">Total</Typography>
                    <Typography variant="h6">{formatVND(total)}</Typography>
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
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <FiClock />
                <Typography variant="h6">
                  Chọn khung giờ (1 giờ/slot)
                </Typography>
              </Stack>

              {slotLoading && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Đang tải danh sách khung giờ...
                </Alert>
              )}
              {slotError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {slotError}
                </Alert>
              )}

              <Grid container spacing={1.5}>
                {slots.map((slot) => {
                  const disabled = isSlotDisabled(slot);
                  const selected = selectedSlot === slot;
                  const freeCount = trainers.filter(
                    (t) => !t.unavailable.includes(slot)
                  ).length;

                  return (
                    <Grid item xs={6} sm={4} md={3} key={slot}>
                      <Tooltip
                        title={
                          disabled
                            ? "Slot đầy: tất cả trainer bận"
                            : `${freeCount} trainer rảnh`
                        }
                      >
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
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    flexWrap: "wrap"
                  }}
                >
                  {selectedSlot && (
                    <Chip color="primary" label={`Đã chọn: ${selectedSlot}`} />
                  )}
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
          </Stack>
        );

      // 2. Trainer (sort: available trước, busy sau)
      case 2: {
        const sortedTrainers = [...trainers].sort((a, b) => {
          const aAvail = selectedSlot
            ? !a.unavailable.includes(selectedSlot)
            : true;
          const bAvail = selectedSlot
            ? !b.unavailable.includes(selectedSlot)
            : true;
          return aAvail === bAvail ? 0 : aAvail ? -1 : 1;
        });

        return (
          <Stack spacing={2}>
            <Typography variant="h6">Chọn Trainer</Typography>
            {!selectedSlot && (
              <Alert severity="info">
                Chưa chọn slot — hệ thống đã <strong>gợi ý</strong> một trainer
                phù hợp. Bạn vẫn có thể chọn lại.
              </Alert>
            )}

            {trainerLoading && (
              <Alert severity="info">Đang tải danh sách huấn luyện viên...</Alert>
            )}
            {trainerError && <Alert severity="warning">{trainerError}</Alert>}

            <Grid container spacing={2}>
              {sortedTrainers.map((t) => {
                const available = selectedSlot
                  ? !t.unavailable.includes(selectedSlot)
                  : true;
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
                        outline: selected
                          ? `2px solid ${theme.palette.primary.main}`
                          : "none",
                        opacity: available ? 1 : 0.6
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="160"
                        image={t.avatar}
                        alt={t.name}
                      />
                      <CardContent>
                        <Stack spacing={1}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography variant="h6" sx={{ flex: 1 }}>
                              {t.name}
                            </Typography>
                            <Chip
                              size="small"
                              label={
                                selectedSlot
                                  ? available
                                    ? "Available"
                                    : "Busy"
                                  : "Available"
                              }
                              color={
                                selectedSlot
                                  ? available
                                    ? "success"
                                    : "default"
                                  : "success"
                              }
                              variant={
                                selectedSlot
                                  ? available
                                    ? "filled"
                                    : "outlined"
                                  : "filled"
                              }
                            />
                          </Stack>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {t.specialties.map((s) => (
                              <Chip
                                key={s}
                                size="small"
                                variant="outlined"
                                label={s}
                              />
                            ))}
                          </Stack>
                          {/* Hàng badge trạng thái lựa chọn + đề xuất */}
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ mt: 1 }}
                            alignItems="center"
                          >
                            {selected && (
                              <Chip
                                size="small"
                                color="primary"
                                label="Đã chọn"
                              />
                            )}
                            {isSuggestedCard && (
                              <Chip
                                size="small"
                                color="secondary"
                                variant="outlined"
                                label="Đề xuất"
                              />
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
                  <>
                    Đã chọn: <strong>{selectedTrainer.name}</strong>
                    {selectedSlot && (
                      <>
                        {" "}
                        — Slot <strong>{selectedSlot}</strong>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    Gợi ý: <strong>{suggestedTrainer?.name}</strong>
                  </>
                )}
                {suggestedTrainer &&
                  selectedTrainer?.id !== suggestedTrainer.id && (
                    <>
                      {" "}
                      — Gợi ý hệ thống:{" "}
                      <strong>{suggestedTrainer.name}</strong>
                    </>
                  )}
              </Alert>
            )}
          </Stack>
        );
      }

      // 3. Payment (Stripe Elements + form)
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
                Trainer đã chọn:{" "}
                <strong>{selectedTrainer?.name || "—"}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng thanh toán: <strong>{formatVND(total)}</strong>
              </Typography>
            </Stack>

            {/* phần form phụ (postalCode, notes) */}
            <PaymentForm
              paymentInfo={paymentInfo}
              onChange={handlePaymentFieldChange}
            />

            {/* phần Stripe Elements tương đương HTML: #card-element */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Thông tin thẻ (Stripe)
              </Typography>
              <Box
                ref={cardElementRef}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid #ddd",
                  minHeight: 50
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Thông tin thẻ được xử lý an toàn bởi Stripe. Chúng tôi không lưu
                số thẻ của bạn.
              </Typography>
            </Box>
          </StyledPaper>
        );

      // 4. Confirmation
      case 4:
        return (
          <StyledPaper>
            <Stack spacing={3} alignItems="center">
              {paymentStatus === "success" ? (
                <>
                  <CircularProgress size={60} sx={{ color: "success.main" }} />
                  <Typography variant="h5">Thanh toán thành công!</Typography>
                  <Typography color="text.secondary" align="center">
                    Cảm ơn bạn đã đặt lịch. Gói tập đã được kích hoạt.
                    <br />
                    Chúng tôi sẽ gửi email xác nhận và nhắc lịch trước buổi tập.
                  </Typography>
                </>
              ) : (
                <>
                  <CircularProgress size={60} sx={{ color: "error.main" }} />
                  <Typography variant="h5" color="error">
                    Thanh toán thất bại
                  </Typography>
                  <Typography color="text.secondary" align="center">
                    Rất tiếc, giao dịch không thành công hoặc bị huỷ.
                    <br />
                    Vui lòng thử lại hoặc liên hệ nhân viên để được hỗ trợ.
                  </Typography>
                </>
              )}
              <Button
                variant="contained"
                startIcon={<FiShoppingBag />}
                onClick={() => {
                  setActiveStep(0);
                  setSelectedSlot(null);
                  setSelectedTrainer(null);
                  setSuggestedTrainer(null);
                  setUserTouchedTrainer(false);
                  setPaymentIntent(null);
                  setPaymentStatus(null);
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
              (activeStep === 0 && (cartItems.length === 0 || packageLoading)) ||
              (activeStep === 1 && !selectedSlot) ||
              (activeStep === 1 &&
                selectedSlot &&
                isSlotDisabled(selectedSlot))
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