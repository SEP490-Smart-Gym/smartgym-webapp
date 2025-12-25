import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  MenuItem
} from "@mui/material";
import {
  FiTrash2,
  FiShoppingBag,
  FiArrowLeft,
  FiArrowRight,
  FiLock
} from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import api from "../../config/axios";

// ============ CONSTANTS ============
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

  // Package
  const [cartItems, setCartItems] = useState([]);
  const [packageLoading, setPackageLoading] = useState(false);
  const [includesPT, setIncludesPT] = useState(false);

  // Trainers
  const [trainers, setTrainers] = useState([]);
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [trainerError, setTrainerError] = useState("");

  // Discount codes
  const [promoCode, setPromoCode] = useState("");
  const [discountCodes, setDiscountCodes] = useState([]);
  const [discountLoading, setDiscountLoading] = useState(false);

  // ====== BƯỚC THANH TOÁN ======
  const steps = useMemo(
    () =>
      includesPT
        ? ["Giỏ hàng", "Chọn huấn luyện viên", "Thanh toán", "Xác nhận"]
        : ["Giỏ hàng", "Thanh toán", "Xác nhận"],
    [includesPT]
  );

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

  // Trainer (xoá selectedSlot/suggest theo slot)
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

  // Stripe
  const [stripeState, setStripeState] = useState({ stripe: null, elements: null });
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
      if (cardElementRef.current) card.mount(cardElementRef.current);
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
      if (stripeCard) stripeCard.unmount();
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

  // ✅ Tính tạm tính (để lọc mã theo minimumPurchaseAmount)
  const calculateSubtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  // ✅ Helper: code hợp lệ theo đơn hiện tại (minimumPurchaseAmount)
  const isCodeApplicableForSubtotal = useCallback((code, subtotal) => {
    if (!code) return false;

    const min = Number(code.minimumPurchaseAmount ?? 0) || 0;

    // Nếu có quy định min và subtotal < min => không hợp lệ để hiện trong list
    if (min > 0 && Number(subtotal || 0) < min) return false;

    // (tuỳ backend) nếu có trạng thái/active thì lọc luôn
    const isActive = code.isActive ?? code.active ?? true;
    if (isActive === false) return false;

    const status = String(code.status ?? "").toLowerCase().trim();
    if (status && !["active", "available", "valid", "enabled"].includes(status)) return false;

    // nếu thiếu code thì bỏ
    if (!String(code.code || "").trim()) return false;

    return true;
  }, []);

  // Fetch discount codes (raw)
  useEffect(() => {
    const fetchDiscountCodes = async () => {
      try {
        setDiscountLoading(true);
        const res = await api.get("/DiscountCode/member/available");
        const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
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

  // ✅ LIST mã giảm giá hiển thị: chỉ lấy mã áp dụng được với subtotal hiện tại
  const applicableDiscountCodes = useMemo(() => {
    return (discountCodes || []).filter((c) => isCodeApplicableForSubtotal(c, calculateSubtotal));
  }, [discountCodes, calculateSubtotal, isCodeApplicableForSubtotal]);

  // ✅ Nếu user đang chọn promoCode nhưng subtotal đổi làm code không còn hợp lệ => reset
  useEffect(() => {
    if (!promoCode) return;
    const stillOk = applicableDiscountCodes.some((c) => c.code === promoCode);
    if (!stillOk) setPromoCode("");
  }, [promoCode, applicableDiscountCodes]);

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
`${t.lastName || ""} ${t.firstName || ""}`.trim() || "Huấn luyện viên",
            avatar:
              "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=800&q=80",
            specialties: t.specialization
              ? t.specialization.split(",").map((s) => s.trim())
              : []
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

  // Suggest trainer (global) — không dựa trên slot
  const getSuggestedTrainerGlobal = useCallback(() => {
    if (trainers.length === 0) return null;
    return trainers[0] || null;
  }, [trainers]);

  useEffect(() => {
    if (!includesPT) return;

    const globalSg = getSuggestedTrainerGlobal();
    setSuggestedTrainer(globalSg);

    if (!userTouchedTrainer) {
      setSelectedTrainer(globalSg);
    }
  }, [includesPT, trainers, getSuggestedTrainerGlobal, userTouchedTrainer]);

  const canProceedFromTrainer = !!selectedTrainer;

  // Lấy object của mã giảm giá đang chọn (đổi sang list applicable để tránh chọn mã không hợp lệ)
  const selectedDiscount = useMemo(
    () => applicableDiscountCodes.find((d) => d.code === promoCode) || null,
    [promoCode, applicableDiscountCodes]
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
      if (max > 0) discount = Math.min(discount, max);
    } else {
      discount = value;
    }

    return Math.min(discount, calculateSubtotal);
  }, [selectedDiscount, calculateSubtotal]);

  const total = useMemo(
    () => Math.max(0, calculateSubtotal - discountAmount),
    [calculateSubtotal, discountAmount]
  );

  // ========== PAYMENT HANDLER ==========
  const handlePaymentSubmit = async () => {
    if (!stripeState.stripe || !stripeCard) {
      return;
    }

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

      const createRes = await api.post("/Payment/create-payment-intent", createBody);

      const { clientSecret, paymentIntentId } = createRes.data || {};
      if (!clientSecret || !paymentIntentId) {
        throw new Error("Thiếu clientSecret hoặc paymentIntentId từ API.");
      }

      setPaymentIntent({ id: paymentIntentId, clientSecret });

      const result = await stripeState.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: stripeCard,
          billing_details: {
            address: { postal_code: paymentInfo.postalCode || undefined }
          }
        }
      });

      if (result.error) {
        setPaymentStatus("failed");
        setActiveStep(steps.length - 1);
        message.error("Lỗi Stripe: " + result.error.message);
        return;
      }

      const stripePI = result.paymentIntent;
      if (stripePI.status !== "succeeded") {
        setPaymentStatus("failed");
        setActiveStep(steps.length - 1);
        message.error(`Thanh toán chưa thành công (trạng thái: ${stripePI.status}).`);
        return;
      }

      const confirmRes = await api.post("/Payment/confirm-payment", {
        paymentIntentId: paymentIntentId || stripePI.id
      });

      if (confirmRes.status === 200) {
        setPaymentStatus("success");
        // ✅ silent update điểm trên navbar
        window.dispatchEvent(new Event("points:updated"));
        message.success("Thanh toán thành công! Gói tập đã được kích hoạt.");
      } else {
        setPaymentStatus("failed");
        message.error("Thanh toán Stripe thành công nhưng xác nhận với hệ thống thất bại.");
      }

      setActiveStep(steps.length - 1);
    } catch (error) {
      console.error("Payment error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        (typeof error?.response?.data === "string" ? error.response.data : "") ||
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

    if (includesPT && stepKey === "trainer" && !selectedTrainer && suggestedTrainer) {
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

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleRemoveItem = useCallback((id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const currentStepKey = getStepKey(activeStep);

  const nextDisabled =
    loading ||
    (currentStepKey === "cart" && (cartItems.length === 0 || packageLoading));

  const renderStepContent = (stepIndex) => {
    const stepKey = getStepKey(stepIndex);

    switch (stepKey) {
      case "cart":
        return (
          <Grid container spacing={3} justifyContent="center" alignItems="flex-start" sx={{ mt: 2 }}>
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
                          <Typography variant="h6">{item.name}</Typography>
                          <Typography variant="body1" color="text.secondary">
                            {formatVND(item.price)}
                          </Typography>

                          <Stack direction="row" spacing={1}>
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
                  <Typography variant="h6">Tóm tắt đơn hàng</Typography>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Tạm tính</Typography>
                    <Typography>{formatVND(calculateSubtotal)}</Typography>
                  </Stack>

                  {selectedDiscount && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Giảm giá</Typography>
                      <Typography color={discountAmount > 0 ? "error" : "text.secondary"}>
                        {discountAmount > 0 ? `- ${formatVND(discountAmount)}` : "0 VND"}
                      </Typography>
                    </Stack>
                  )}

                  <Divider />

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6">Tổng thanh toán</Typography>
                    <Typography variant="h6">{formatVND(total)}</Typography>
                  </Stack>

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
                          calculateSubtotal < (selectedDiscount.minimumPurchaseAmount || 0)
                        ? `Đơn hàng từ ${formatVND(
                            selectedDiscount.minimumPurchaseAmount || 0
                          )} mới được áp dụng mã này.`
                        : "Chọn mã giảm giá (nếu có)."
                    }
                  >
                    <MenuItem value="">Không sử dụng mã</MenuItem>
                    {applicableDiscountCodes.map((code) => (
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

case "trainer": {
  const sortedTrainers = [...trainers];

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Chọn huấn luyện viên</Typography>

      {trainerLoading && <Alert severity="info">Đang tải danh sách huấn luyện viên...</Alert>}
      {trainerError && <Alert severity="warning">{trainerError}</Alert>}

      <Grid container spacing={2}>
  {sortedTrainers.map((t) => {
    const selected = selectedTrainer?.id === t.id;
    const isSuggestedCard = suggestedTrainer?.id === t.id;

    return (
      <Grid item xs={12} md={4} key={t.id}>
        <StyledCard
          onClick={() => {
            setSelectedTrainer(t);
            setUserTouchedTrainer(true);
          }}
          sx={{
                        cursor: "pointer",
            outline: selected ? `2px solid ${theme.palette.primary.main}` : "none"
          }}
        >
          <CardMedia component="img" height="160" image={t.avatar} alt={t.name} />
                      <CardContent>
                        <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" sx={{ flex: 1 }}>
                {t.name}
              </Typography>
              <Chip size="small" label="Rảnh" color="success" />
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
  {t.specialties.map((s) => (
    <Chip key={s} size="small" variant="outlined" label={s} />
  ))}
</Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
              {selected && <Chip size="small" color="primary" label="Đã chọn" />}
              {isSuggestedCard && (
                <Chip size="small" color="secondary" variant="outlined" label="Gợi ý hệ thống" />
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
          Đã chọn huấn luyện viên: <strong>{selectedTrainer?.name || suggestedTrainer?.name}</strong>
          {suggestedTrainer && selectedTrainer?.id !== suggestedTrainer.id && (
            <>
              {" "}
              — Gợi ý hệ thống: <strong>{suggestedTrainer.name}</strong>
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
                <Typography variant="body2" color="text.secondary">
                  Huấn luyện viên: <strong>{selectedTrainer?.name || "Chưa chọn"}</strong>
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Tạm tính: <strong>{formatVND(calculateSubtotal)}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Giảm giá: <strong>{discountAmount > 0 ? `- ${formatVND(discountAmount)}` : "0 VND"}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng thanh toán: <strong>{formatVND(total)}</strong>
              </Typography>
              {promoCode && (
                <Typography variant="caption" color="text.secondary">
                  Mã áp dụng: {promoCode}.
                </Typography>
              )}
            </Stack>

            <PaymentForm paymentInfo={paymentInfo} onChange={handlePaymentFieldChange} />

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
                Thông tin thẻ được xử lý an toàn bởi Stripe. Chúng tôi không lưu trữ số thẻ của bạn.
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
                  <CircularProgress size={60} sx={{ color: "success.main" }} />
                  <Typography variant="h5">Thanh toán thành công!</Typography>
                  <Typography color="text.secondary" align="center">
                    Cảm ơn bạn đã đặt gói tập tại phòng gym.
                    <br />
                    Gói tập đã được kích hoạt.
                  </Typography>
                </>
              ) : (
                <>
                  <CircularProgress size={60} sx={{ color: "error.main" }} />
                  <Typography variant="h5" color="error">
                    Thanh toán thất bại
                  </Typography>
                  <Typography color="text.secondary" align="center">
                    Rất tiếc, giao dịch không thành công hoặc đã bị huỷ.
                    <br />
                    Vui lòng thử lại hoặc liên hệ nhân viên để được hỗ trợ.
                  </Typography>
                </>
              )}

              <Button variant="contained" startIcon={<FiShoppingBag />} onClick={() => navigate("/")}>
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
        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
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
            endIcon={currentStepKey === "payment" ? <FiLock /> : <FiArrowRight />}
            onClick={guardedNext}
            disabled={
              loading ||
              (currentStepKey === "cart" && (cartItems.length === 0 || packageLoading))
            }
          >
            {loading ? <CircularProgress size={24} /> : currentStepKey === "payment" ? "Thanh toán" : "Tiếp tục"}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default CartComponent;
