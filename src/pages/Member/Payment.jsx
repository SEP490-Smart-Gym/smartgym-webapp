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
  Alert,
  Chip,
  Tooltip,
  MenuItem
} from "@mui/material";
import {
  FiTrash2,
  FiShoppingBag,
  FiArrowLeft,
  FiArrowRight,
  FiLock,
  FiClock
} from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import api from "../../config/axios";

// ============ CONSTANTS ============
// TODO: dùng env cho key này khi build thật
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

const formatVND = (value) => {
  const number = Number(value) || 0;
  return `${Math.round(number).toLocaleString("vi-VN")} VND`;
};

const CartComponent = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const packageId = id || 1;

  const SINGLE_SERVICE = true; // hiện giờ chỉ 1 gói / đơn

  // Package
  const [cartItems, setCartItems] = useState([]);
  const [packageLoading, setPackageLoading] = useState(false);
  const [includesPT, setIncludesPT] = useState(false);

  // Trainers
  const [trainers, setTrainers] = useState([]);
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [trainerError, setTrainerError] = useState("");

  // TimeSlots (tạm ẩn giao diện nhưng vẫn giữ state & fetch để sau này bật lại)
  const [slots, setSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");

  // Discount codes
  const [promoCode, setPromoCode] = useState(""); // code được chọn
  const [discountCodes, setDiscountCodes] = useState([]);
  const [discountLoading, setDiscountLoading] = useState(false);

  // ====== BƯỚC THANH TOÁN ======
  // 🔴 ĐÃ BỎ BƯỚC "Chọn giờ tập" khỏi steps
  const steps = useMemo(
    () =>
      includesPT
        ? ["Giỏ hàng", "Chọn huấn luyện viên", "Thanh toán", "Xác nhận"]
        : ["Giỏ hàng", "Thanh toán", "Xác nhận"],
    [includesPT]
  );

  // 🔴 ĐÃ BỎ "slot" khỏi key step
  const getStepKey = useCallback(
    (index) => {
      const withPT = ["cart", "trainer", "payment", "confirmation"];
      const withoutPT = ["cart", "payment", "confirmation"];
      return includesPT ? withPT[index] : withoutPT[index];
    },
    [includesPT]
  );

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Time slot & Trainer
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [userTouchedTrainer, setUserTouchedTrainer] = useState(false);
  const [suggestedTrainer, setSuggestedTrainer] = useState(null);

  const [paymentInfo, setPaymentInfo] = useState({
    postalCode: "",
    notes: "",
    isAutoRenewal: true
  });

  const [paymentIntent, setPaymentIntent] = useState(null); // { id, clientSecret }
  const [paymentStatus, setPaymentStatus] = useState(null);

  const handlePaymentFieldChange = (field, value) => {
    setPaymentInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Stripe state
  const [stripeState, setStripeState] = useState({
    stripe: null,
    elements: null
  });
  const [stripeCard, setStripeCard] = useState(null);
  const cardElementRef = useRef(null);

  // Load Stripe khi vào step Payment
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

    return () => {
      if (stripeCard) {
        stripeCard.unmount();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, getStepKey]);

  // Fetch package
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
        message.error("Không tải được gói tập. Vui lòng thử lại.");
      } finally {
        setPackageLoading(false);
      }
    };

    fetchPackage();
  }, [packageId]);

  // Fetch discount codes
  useEffect(() => {
    const fetchDiscountCodes = async () => {
      try {
        setDiscountLoading(true);
        const res = await api.get("/DiscountCode/member/available");
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.items ?? [];
        setDiscountCodes(data);
      } catch (error) {
        console.error("Error fetching discount codes:", error);
        message.error("Không tải được danh sách mã giảm giá.");
      } finally {
        setDiscountLoading(false);
      }
    };

    fetchDiscountCodes();
  }, []);

  // Fetch trainers (nếu có PT)
  useEffect(() => {
    if (!includesPT) return;

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
            name:
              `${t.firstName || ""} ${t.lastName || ""}`.trim() ||
              "Huấn luyện viên",
            avatar:
              "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=800&q=80",
            specialties: t.specialization
              ? t.specialization.split(",").map((s) => s.trim())
              : [],
            unavailable: []
          }));

        setTrainers(mapped);
      } catch (error) {
        console.error("Error fetching trainers:", error);
        setTrainerError("Không tải được danh sách huấn luyện viên.");
        message.error("Không tải được danh sách huấn luyện viên.");
        setTrainers([]);
      } finally {
        setTrainerLoading(false);
      }
    };

    fetchTrainers();
  }, [includesPT]);

  // Fetch timeslots (nếu có PT) — vẫn fetch nhưng UI đang tạm ẩn
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
        message.error("Không tải được danh sách khung giờ.");
        setSlots([]);
      } finally {
        setSlotLoading(false);
      }
    };

    fetchTimeSlots();
  }, [includesPT]);

  const isSlotDisabled = (slot) =>
    trainers.length > 0 && trainers.every((t) => t.unavailable.includes(slot));

  // Suggest trainer
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

  const canProceedFromTrainer = !!selectedTrainer;

  // Tính tạm tính
  const calculateSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      ),
    [cartItems]
  );

  // Lấy object của mã giảm giá đang chọn
  const selectedDiscount = useMemo(
    () =>
      discountCodes.find((d) => d.code === promoCode) || null,
    [promoCode, discountCodes]
  );

  // Tính số tiền giảm & tổng sau giảm
  const discountAmount = useMemo(() => {
    if (!selectedDiscount) return 0;
    if (!calculateSubtotal || calculateSubtotal <= 0) return 0;

    const min = selectedDiscount.minimumPurchaseAmount || 0;
    if (calculateSubtotal < min) return 0;

    let discount = 0;
    const value = Number(selectedDiscount.discountValue) || 0;

    if (selectedDiscount.discountType === "Percentage") {
      discount = (calculateSubtotal * value) / 100;
      const max = Number(selectedDiscount.maxDiscountAmount) || 0;
      if (max > 0) {
        discount = Math.min(discount, max);
      }
    } else {
      // fallback cho dạng "Amount" / "Fixed"
      discount = value;
    }

    // Không cho giảm quá số tiền tạm tính
    return Math.min(discount, calculateSubtotal);
  }, [selectedDiscount, calculateSubtotal]);

  const total = useMemo(
    () => Math.max(0, calculateSubtotal - discountAmount),
    [calculateSubtotal, discountAmount]
  );

  // ========== PAYMENT HANDLER ==========
  const handlePaymentSubmit = async () => {
    if (!stripeState.stripe || !stripeCard) {
      message.warning(
        "Đang khởi tạo biểu mẫu thanh toán Stripe, vui lòng thử lại sau vài giây."
      );
      return;
    }

    // 🔴 KHÔNG CÒN BẮT BUỘC selectedSlot
    if (includesPT && !selectedTrainer) {
      message.error("Vui lòng chọn huấn luyện viên.");
      return;
    }

    if (cartItems.length === 0) {
      message.error("Giỏ hàng đang trống.");
      return;
    }

    try {
      setLoading(true);
      message.info("Đang khởi tạo giao dịch thanh toán...");

      const pkg = cartItems[0];
      const startDateISO = new Date().toISOString();

      const createBody = {
        packageId: Number(pkg.id),
        startDate: startDateISO,
        isAutoRenewal: !!paymentInfo.isAutoRenewal,
        discountCode: promoCode || null,
        notes: paymentInfo.notes?.trim() || null
      };

      if (includesPT && selectedTrainer) {
        createBody.trainerId = Number(selectedTrainer.id);
      }

      console.log("Create payment intent body:", createBody);

      const createRes = await api.post(
        "/Payment/create-payment-intent",
        createBody
      );

      console.log("create-payment-intent response:", createRes.data);

      const {
        clientSecret,
        paymentIntentId
      } = createRes.data || {};

      if (!clientSecret || !paymentIntentId) {
        throw new Error("Thiếu clientSecret hoặc paymentIntentId từ API.");
      }

      setPaymentIntent({ id: paymentIntentId, clientSecret });

      message.info("Đang xác nhận thanh toán với Stripe...");

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
        message.error("Lỗi Stripe: " + result.error.message);
        return;
      }

      const stripePI = result.paymentIntent;
      console.log("Stripe status:", stripePI.status, stripePI.id);

      if (stripePI.status !== "succeeded") {
        setPaymentStatus("failed");
        setActiveStep(steps.length - 1);
        message.error(
          `Thanh toán chưa thành công (trạng thái: ${stripePI.status}).`
        );
        return;
      }

      message.info("Đang xác nhận thanh toán với hệ thống...");

      const confirmRes = await api.post("/Payment/confirm-payment", {
        paymentIntentId: paymentIntentId || stripePI.id
      });

      console.log("confirm-payment response:", confirmRes.data);

      if (confirmRes.status === 200) {
        setPaymentStatus("success");
        message.success("Thanh toán thành công! Gói tập đã được kích hoạt.");
      } else {
        setPaymentStatus("failed");
        message.error(
          "Thanh toán Stripe thành công nhưng xác nhận với hệ thống thất bại."
        );
      }

      setActiveStep(steps.length - 1);
    } catch (error) {
      console.error("Payment error:", error);
      console.log("Payment error response:", error?.response?.data);

      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        (typeof error?.response?.data === "string"
          ? error.response.data
          : "") ||
        "Có lỗi khi xử lý thanh toán. Vui lòng thử lại.";

      setPaymentStatus("failed");
      setActiveStep(steps.length - 1);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const guardedNext = () => {
    const stepKey = getStepKey(activeStep);

    // 🔴 BỎ PHẦN CHECK CHO "slot" (vì đã ẩn step)
    if (
      includesPT &&
      stepKey === "trainer" &&
      !selectedTrainer &&
      suggestedTrainer
    ) {
      setSelectedTrainer(suggestedTrainer);
      setUserTouchedTrainer(false);
    }
    if (includesPT && stepKey === "trainer" && !canProceedFromTrainer) {
      return message.warning("Vui lòng chọn huấn luyện viên.");
    }

    if (stepKey === "payment") {
      return handlePaymentSubmit();
    }

    setLoading(true);
    setTimeout(() => {
      setActiveStep((prev) => prev + 1);
      setLoading(false);
      message.success("Đã hoàn thành bước này.");
    }, 800);
  };

  const handleNext = guardedNext;
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleRemoveItem = useCallback((id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const currentStepKey = getStepKey(activeStep);

  const nextDisabled =
    loading ||
    (currentStepKey === "cart" &&
      (cartItems.length === 0 || packageLoading));

  const renderStepContent = (stepIndex) => {
    const stepKey = getStepKey(stepIndex);

    switch (stepKey) {
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
                    Đang tải thông tin gói tập...
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
                          <Typography variant="h6">
                            {item.name}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {formatVND(item.price)}
                          </Typography>

                          <Stack direction="row" spacing={1}>
                            <IconButton
                              color="error"
                              onClick={() =>
                                handleRemoveItem(item.id)
                              }
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
                  <Typography variant="h6">Tóm tắt đơn hàng</Typography>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography>Tạm tính</Typography>
                    <Typography>{formatVND(calculateSubtotal)}</Typography>
                  </Stack>

                  {selectedDiscount && (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                    >
                      <Typography>Giảm giá</Typography>
                      <Typography color={discountAmount > 0 ? "error" : "text.secondary"}>
                        {discountAmount > 0
                          ? `- ${formatVND(discountAmount)}`
                          : "0 VND"}
                      </Typography>
                    </Stack>
                  )}

                  <Divider />

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography variant="h6">
                      Tổng thanh toán
                    </Typography>
                    <Typography variant="h6">
                      {formatVND(total)}
                    </Typography>
                  </Stack>

                  {/* Chọn mã giảm giá từ API */}
                  <TextField
                    select
                    label="Mã giảm giá"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    fullWidth
                    helperText={
                      discountLoading
                        ? "Đang tải danh sách mã giảm giá..."
                        : selectedDiscount &&
                          calculateSubtotal <
                            (selectedDiscount.minimumPurchaseAmount || 0)
                        ? `Đơn hàng từ ${formatVND(
                            selectedDiscount.minimumPurchaseAmount || 0
                          )} mới được áp dụng mã này.`
                        : "Chọn mã giảm giá (nếu có). Số tiền được giảm sẽ trừ trực tiếp vào tổng."
                    }
                  >
                    <MenuItem value="">Không sử dụng mã</MenuItem>
                    {discountCodes.map((code) => (
                      <MenuItem key={code.id} value={code.code}>
                        {code.code}{" "}
                        {code.discountType === "Percentage"
                          ? ` - Giảm ${code.discountValue || 0}%`
                          : ` - Giảm ${formatVND(code.discountValue || 0)}`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </StyledPaper>
            </Grid>
          </Grid>
        );

      // UI chọn slot vẫn giữ nguyên case này, nhưng sẽ không bao giờ được gọi
      // vì "slot" đã bị bỏ khỏi steps & getStepKey.
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
                        title={disabled
                          ? "Slot đã đầy: tất cả huấn luyện viên đều bận."
                          : `${freeCount} huấn luyện viên rảnh ở slot này`}
                      >
                        <span>
                          <SlotButton
                            variant={selected ? "contained" : "outlined"}
                            onClick={() =>
                              !disabled && setSelectedSlot(slot)
                            }
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
            </StyledPaper>
          </Stack>
        );

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
            <Typography variant="h6">Chọn huấn luyện viên</Typography>
            {!selectedSlot && (
              <Alert severity="info">
                Bạn chưa chọn khung giờ — hệ thống đã{" "}
                <strong>gợi ý</strong> một huấn luyện viên phù hợp. Bạn vẫn
                có thể chọn lại nếu muốn.
              </Alert>
            )}

            {trainerLoading && (
              <Alert severity="info">
                Đang tải danh sách huấn luyện viên...
              </Alert>
            )}
            {trainerError && (
              <Alert severity="warning">{trainerError}</Alert>
            )}

            <Grid container spacing={2}>
              {sortedTrainers.map((t) => {
                const available = selectedSlot
                  ? !t.unavailable.includes(selectedSlot)
                  : true;
                const selected = selectedTrainer?.id === t.id;
                const isSuggestedCard =
                  suggestedTrainer?.id === t.id;

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
                            <Typography
                              variant="h6"
                              sx={{ flex: 1 }}
                            >
                              {t.name}
                            </Typography>
                            <Chip
                              size="small"
                              label={selectedSlot
                                ? available
                                  ? "Rảnh"
                                  : "Bận"
                                : "Rảnh"}
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
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                          >
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
                                label="Gợi ý hệ thống"
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
                    Đã chọn huấn luyện viên:{" "}
                    <strong>{selectedTrainer.name}</strong>
                    {selectedSlot && (
                      <>
                        {" "}
                        — Khung giờ <strong>{selectedSlot}</strong>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    Gợi ý huấn luyện viên:{" "}
                    <strong>{suggestedTrainer?.name}</strong>
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

      case "payment":
        return (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Thông tin thanh toán
            </Typography>
            <Stack spacing={1} sx={{ mb: 2 }}>
              {includesPT && (
                <>
                  {/* Có thể giữ dòng khung giờ ở đây để "Chưa chọn" cũng được
                      nếu muốn ẩn hẳn, có thể xoá block này */}
                  <Typography variant="body2" color="text.secondary">
                    Khung giờ:{" "}
                    <strong>{selectedSlot || "Chưa chọn"}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Huấn luyện viên:{" "}
                    <strong>{selectedTrainer?.name || "Chưa chọn"}</strong>
                  </Typography>
                </>
              )}
              <Typography variant="body2" color="text.secondary">
                Tạm tính: <strong>{formatVND(calculateSubtotal)}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Giảm giá:{" "}
                <strong>
                  {discountAmount > 0
                    ? `- ${formatVND(discountAmount)}`
                    : "0 VND"}
                </strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng thanh toán:{" "}
                <strong>{formatVND(total)}</strong>
              </Typography>
              {promoCode && (
                <Typography variant="caption" color="text.secondary">
                  Mã áp dụng: {promoCode}. Số tiền giảm được tính theo thông
                  tin mã và có thể được làm tròn nhẹ khi xử lý ở hệ thống.
                </Typography>
              )}
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
                Thông tin thẻ được xử lý an toàn bởi Stripe. Chúng tôi
                không lưu trữ số thẻ của bạn.
              </Typography>
            </Box>
          </StyledPaper>
        );

      case "confirmation":
        return (
          <StyledPaper>
            <Stack spacing={3} alignItems="center">
              {paymentStatus === "success" ? (
                <>
                  <CircularProgress
                    size={60}
                    sx={{ color: "success.main" }}
                  />
                  <Typography variant="h5">
                    Thanh toán thành công!
                  </Typography>
                  <Typography
                    color="text.secondary"
                    align="center"
                  >
                    Cảm ơn bạn đã đặt gói tập tại phòng gym.
                    <br />
                    Gói tập đã được kích hoạt. Chúng tôi sẽ gửi email
                    xác nhận và nhắc lịch trước buổi tập.
                  </Typography>
                </>
              ) : (
                <>
                  <CircularProgress
                    size={60}
                    sx={{ color: "error.main" }}
                  />
                  <Typography variant="h5" color="error">
                    Thanh toán thất bại
                  </Typography>
                  <Typography
                    color="text.secondary"
                    align="center"
                  >
                    Rất tiếc, giao dịch không thành công hoặc đã bị huỷ.
                    <br />
                    Vui lòng thử lại hoặc liên hệ nhân viên để được hỗ trợ.
                  </Typography>
                </>
              )}
              <Button
                variant="contained"
                startIcon={<FiShoppingBag />}
                onClick={() => navigate("/")}
              >
                Quay về trang chủ
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
        Thanh toán gói tập
      </Typography>

      <CheckoutSteps activeStep={activeStep} steps={steps} />
      {renderStepContent(activeStep)}

      {currentStepKey !== "confirmation" && (
        <Box
          sx={{
            mt: 4,
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <Button
            variant="outlined"
            startIcon={<FiArrowLeft />}
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            Quay lại
          </Button>
          <Button
            variant="contained"
            endIcon={
              currentStepKey === "payment" ? (
                <FiLock />
              ) : (
                <FiArrowRight />
              )
            }
            onClick={guardedNext}
            disabled={nextDisabled}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : currentStepKey === "payment" ? (
              "Thanh toán"
            ) : (
              "Tiếp tục"
            )}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default CartComponent;
