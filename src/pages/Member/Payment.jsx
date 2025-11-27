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
import { useNavigate } from "react-router-dom";

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

// ----- PaymentForm: giữ notes (postalCode nếu cần thêm sau) -----
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

const CartComponent = () => {
  const theme = useTheme();
  const { id } = useParams(); // /checkout/:id
  const packageId = id || 1; // nếu không có id thì tạm dùng 1
  const navigate = useNavigate();

  const SINGLE_SERVICE = true; // vẫn giữ logic chỉ 1 dịch vụ

  // ====== Cart / Package state (lấy từ API Package/active/:id) ======
  const [cartItems, setCartItems] = useState([]);
  const [packageLoading, setPackageLoading] = useState(false);
  const [includesPT, setIncludesPT] = useState(false); // gói có PT hay không

  // ====== Trainer state (lấy từ API guest/trainers) ======
  const [trainers, setTrainers] = useState([]); // không dùng mock nữa
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [trainerError, setTrainerError] = useState("");

  // ====== TimeSlot state (lấy từ API /TimeSlot) ======
  const [slots, setSlots] = useState([]); // mảng string kiểu "05:00-06:00"
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");

  // Bước sẽ phụ thuộc includesPT:
  //  - Có PT: Cart → Slot → Trainer → Payment → Confirmation
  //  - Không có PT: Cart → Payment → Confirmation
  const steps = useMemo(
    () =>
      includesPT
        ? ["Cart", "Slot", "Trainer", "Payment", "Confirmation"]
        : ["Cart", "Payment", "Confirmation"],
    [includesPT]
  );

  // map index -> key logic
  const getStepKey = useCallback(
    (index) => {
      const withPT = ["cart", "slot", "trainer", "payment", "confirmation"];
      const withoutPT = ["cart", "payment", "confirmation"];
      return includesPT ? withPT[index] : withoutPT[index];
    },
    [includesPT]
  );

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
    const stepKey = getStepKey(activeStep);
    if (stepKey !== "payment") return;

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
  }, [activeStep, getStepKey]);

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
          image:
            "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=800&q=80",
          stock: 1
        };

        setCartItems([mappedItem]);
        setIncludesPT(!!pkg.includesPersonalTrainer);
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

  // ====== Fetch trainers from API (chỉ khi gói có PT) ======
  useEffect(() => {
    if (!includesPT) return; // gói không có PT thì không cần gọi

    const fetchTrainers = async () => {
      try {
        setTrainerLoading(true);
        setTrainerError("");
        const res = await api.get("/guest/trainers");
        const data = Array.isArray(res.data) ? res.data : [];

        const mapped = data
          .filter((t) => t.isAvailableForNewClients !== false)
          .map((t) => ({
            id: t.trainerId,
            name: `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Trainer",
            avatar:
              "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=800&q=80",
            specialties: t.specialization
              ? t.specialization.split(",").map((s) => s.trim())
              : [],
            unavailable: [] // hiện tại API chưa trả slot bận theo giờ, tạm cho tất cả rảnh
          }));

        setTrainers(mapped);
      } catch (error) {
        console.error("Error fetching trainers:", error);
        setTrainerError("Không tải được danh sách huấn luyện viên.");
        setSnackbar({
          open: true,
          message: "Không tải được danh sách trainer.",
          severity: "error"
        });
        setTrainers([]);
      } finally {
        setTrainerLoading(false);
      }
    };

    fetchTrainers();
  }, [includesPT]);

  // ====== Fetch TimeSlots from API /TimeSlot (chỉ khi gói có PT) ======
  useEffect(() => {
    if (!includesPT) return;

    const fetchTimeSlots = async () => {
      try {
        setSlotLoading(true);
        setSlotError("");
        const res = await api.get("/TimeSlot");
        const data = Array.isArray(res.data) ? res.data : [];

        const mappedSlots = data
          .map((ts) => {
            if (ts.timeRange) return ts.timeRange;
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
        setSlots([]);
      } finally {
        setSlotLoading(false);
      }
    };

    fetchTimeSlots();
  }, [includesPT]);

  // Một slot bị disable nếu TẤT CẢ trainer đều bận ở slot đó
  const isSlotDisabled = (slot) =>
    trainers.length > 0 && trainers.every((t) => t.unavailable.includes(slot));

  // ====== Auto-suggest Trainer (dùng trainers từ API) ======
  const getSuggestedTrainerForSlot = useCallback(
    (slot) => {
      if (!slot || trainers.length === 0) return null;
      const candidate = trainers.find((t) => !t.unavailable.includes(slot));
      return candidate || null;
    },
    [trainers]
  );

  const getSuggestedTrainerGlobal = useCallback(() => {
    if (trainers.length === 0) return null;
    const sorted = [...trainers].sort(
      (a, b) => (a.unavailable?.length || 0) - (b.unavailable?.length || 0)
    );
    return sorted[0] || null;
  }, [trainers]);

  // Auto-suggest & auto-select nếu user chưa chọn tay (chỉ ý nghĩa khi includesPT = true)
  useEffect(() => {
    if (!includesPT) return;

    if (selectedSlot) {
      const suggested = getSuggestedTrainerForSlot(selectedSlot);
      setSuggestedTrainer(suggested);

      const stillOk =
        selectedTrainer && !selectedTrainer.unavailable.includes(selectedSlot);
      if (!stillOk) {
        setSelectedTrainer(suggested || null);
        setUserTouchedTrainer(false);
      }
    } else {
      const globalSg = getSuggestedTrainerGlobal();
      setSuggestedTrainer(globalSg);
      if (!userTouchedTrainer) {
        setSelectedTrainer(globalSg);
      }
    }
  }, [
    includesPT,
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

    // Nếu gói có PT thì bắt buộc phải có slot + trainer
    if (includesPT && (!selectedTrainer || !selectedSlot)) {
      setSnackbar({
        open: true,
        message: "Thiếu thông tin slot/trainer.",
        severity: "error"
      });
      return;
    }

    if (cartItems.length === 0) {
      setSnackbar({
        open: true,
        message: "Giỏ hàng đang trống.",
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

      const startDateISO = new Date().toISOString();

      const createBody = {
        packageId: pkg.id,
        trainerId: includesPT && selectedTrainer ? selectedTrainer.id : null,
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
        setActiveStep(steps.length - 1);
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
        setActiveStep(steps.length - 1);
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

      setSnackbar({
        open: true,
        message: "Đang xác nhận thanh toán với hệ thống...",
        severity: "info"
      });

      const confirmRes = await api.post("/Payment/confirm-payment", {
        paymentIntentId: stripePI.id
      });

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

      setActiveStep(steps.length - 1); // sang Confirmation
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("failed");
      setActiveStep(steps.length - 1);
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
    const stepKey = getStepKey(activeStep);

    if (includesPT && stepKey === "slot" && !canProceedFromSlot) {
      return setSnackbar({
        open: true,
        message: "Vui lòng chọn khung giờ trước.",
        severity: "warning"
      });
    }

    if (includesPT && stepKey === "trainer" && !selectedTrainer && suggestedTrainer) {
      setSelectedTrainer(suggestedTrainer);
      setUserTouchedTrainer(false);
    }
    if (includesPT && stepKey === "trainer" && !canProceedFromTrainer) {
      return setSnackbar({
        open: true,
        message: "Vui lòng chọn trainer.",
        severity: "warning"
      });
    }

    if (stepKey === "payment") {
      return handlePaymentSubmit();
    }

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

  const renderStepContent = (stepIndex) => {
    const stepKey = getStepKey(stepIndex);

    switch (stepKey) {
      // ===== 0. Cart =====
      case "cart":
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

      // ===== 1. Slot (chỉ khi includesPT = true) =====
      case "slot":
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

      // ===== Trainer (chỉ khi includesPT = true) =====
      case "trainer": {
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
              <Alert severity="info">
                Đang tải danh sách huấn luyện viên...
              </Alert>
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
                        if (!available) return;
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

      // ===== Payment =====
      case "payment":
        return (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <Stack spacing={1} sx={{ mb: 2 }}>
              {includesPT && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Slot: <strong>{selectedSlot || "Chưa chọn"}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trainer đã chọn:{" "}
                    <strong>{selectedTrainer?.name || "—"}</strong>
                  </Typography>
                </>
              )}
              <Typography variant="body2" color="text.secondary">
                Tổng thanh toán: <strong>{formatVND(total)}</strong>
              </Typography>
            </Stack>

            <PaymentForm
              paymentInfo={paymentInfo}
              onChange={handlePaymentFieldChange}
            />

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

      // ===== Confirmation =====
      case "confirmation":
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
                onClick={() => navigate("/")}  // 👉 Điều hướng về trang Home
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

  const currentStepKey = getStepKey(activeStep);

  const nextDisabled =
    loading ||
    (currentStepKey === "cart" &&
      (cartItems.length === 0 || packageLoading)) ||
    (includesPT &&
      currentStepKey === "slot" &&
      (!selectedSlot ||
        (selectedSlot && isSlotDisabled(selectedSlot))));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Checkout
      </Typography>

      <CheckoutSteps activeStep={activeStep} steps={steps} />
      {renderStepContent(activeStep)}

      {/* Ẩn nút điều hướng trên màn hình Confirmation */}
      {currentStepKey !== "confirmation" && (
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
            endIcon={currentStepKey === "payment" ? <FiLock /> : <FiArrowRight />}
            onClick={handleNext}
            disabled={nextDisabled}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : currentStepKey === "payment" ? (
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
