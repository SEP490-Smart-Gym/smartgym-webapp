// src/pages/Payment/PaymentPage.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Stack,
  Box,
  CircularProgress,
  Button,
  styled,
} from "@mui/material";
import { FiLock } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import api from "../../config/axios";

const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51SS4bPRq7GZWeiD8KPMbvTaHs21UB7LUYmSVcqyNtQ6RghCpQvmgUFMkTGzvsKbxKodpE7jEVmZVDXICO2gK3Yz100upoioxdl";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
}));

const formatVND = (value) => {
  const number = Number(value) || 0;
  return `${Math.round(number).toLocaleString("vi-VN")} VND`;
};

const PaymentPage = () => {
  const { paymentIntentId } = useParams(); // từ URL: /payment/:paymentIntentId
  const location = useLocation();
  const navigate = useNavigate();

  // object payment được truyền từ PaymentHistory
  const paymentFromState = location.state?.payment || null;

  const [stripeState, setStripeState] = useState({
    stripe: null,
    elements: null,
  });
  const [stripeCard, setStripeCard] = useState(null);
  const cardElementRef = useRef(null);

  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // success | failed

  // Lấy clientSecret cho paymentIntentId hiện tại
  useEffect(() => {
    if (!paymentIntentId) {
      message.error("Thiếu mã thanh toán (paymentIntentId).");
      return;
    }

    const fetchClientSecret = async () => {
      try {
        setInitLoading(true);

        // TODO: backend cần hỗ trợ endpoint trả về clientSecret
        // Ví dụ: POST /Payment/get-payment-intent-client-secret
        // body: { paymentIntentId: "pi_xxx" }
        const res = await api.post(
          "/Payment/get-payment-intent-client-secret",
          {
            paymentIntentId,
          }
        );

        const cs = res.data?.clientSecret;
        if (!cs) {
          throw new Error("Không nhận được clientSecret từ server.");
        }
        setClientSecret(cs);
      } catch (error) {
        console.error("Error fetching clientSecret:", error);
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.title ||
          error?.message ||
          "Không thể khởi tạo thông tin thanh toán.";
        message.error(msg);
      } finally {
        setInitLoading(false);
      }
    };

    fetchClientSecret();
  }, [paymentIntentId]);

  // Load Stripe khi đã có clientSecret (hoặc khi vào page)
  useEffect(() => {
    if (!clientSecret) return;

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
  }, [clientSecret]);

  const handlePay = async () => {
    if (!stripeState.stripe || !stripeCard) {
      message.warning(
        "Đang khởi tạo form thanh toán Stripe, vui lòng thử lại sau vài giây."
      );
      return;
    }
    if (!clientSecret) {
      message.error("Thiếu clientSecret để xác nhận thanh toán.");
      return;
    }

    try {
      setLoading(true);
      message.info("Đang xác nhận thanh toán với Stripe...");

      const result = await stripeState.stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: stripeCard,
          },
        }
      );

      if (result.error) {
        console.error("Stripe error:", result.error);
        setPaymentStatus("failed");
        message.error("Lỗi Stripe: " + result.error.message);
        return;
      }

      const stripePI = result.paymentIntent;
      console.log("Stripe status:", stripePI.status, stripePI.id);

      if (stripePI.status !== "succeeded") {
        setPaymentStatus("failed");
        message.error(
          `Thanh toán chưa thành công (trạng thái: ${stripePI.status}).`
        );
        return;
      }

      message.info("Đang xác nhận thanh toán với hệ thống...");

      // confirm với backend
      const confirmRes = await api.post("/Payment/confirm-payment", {
        paymentIntentId: stripePI.id,
      });

      if (confirmRes.status === 200) {
        setPaymentStatus("success");
        message.success("Thanh toán thành công! Gói tập đã được kích hoạt.");
      } else {
        setPaymentStatus("failed");
        message.error(
          "Thanh toán Stripe thành công nhưng xác nhận với hệ thống thất bại."
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        (typeof error?.response?.data === "string"
          ? error.response.data
          : "") ||
        "Có lỗi khi xử lý thanh toán. Vui lòng thử lại.";
      setPaymentStatus("failed");
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const amount = paymentFromState?.finalAmount ?? paymentFromState?.amount ?? 0;
  const statusLabel = (paymentFromState?.paymentStatus || "").toLowerCase();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Thanh toán đơn hàng
      </Typography>

      <StyledPaper>
        {initLoading ? (
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography>Đang chuẩn bị thông tin thanh toán...</Typography>
          </Stack>
        ) : (
          <>
            {/* Thông tin đơn thanh toán (chỉ hiển thị, không cho chỉnh) */}
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Mã thanh toán:
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {paymentFromState?.id ?? "—"}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Trạng thái hiện tại:
              </Typography>
              <Typography
                variant="body1"
                fontWeight={600}
                color={
                  statusLabel === "pending"
                    ? "primary"
                    : statusLabel === "failed"
                    ? "error"
                    : "success.main"
                }
              >
                {statusLabel === "pending"
                  ? "Đang chờ thanh toán"
                  : statusLabel === "failed"
                  ? "Thanh toán thất bại"
                  : statusLabel === "completed" || statusLabel === "success"
                  ? "Thanh toán thành công"
                  : paymentFromState?.paymentStatus || "Không rõ"}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Số tiền cần thanh toán:
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {formatVND(amount)}
              </Typography>

              {paymentFromState?.paymentMethodName && (
                <>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Phương thức:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {paymentFromState.paymentMethodName}
                  </Typography>
                </>
              )}

              {paymentFromState?.notes && (
                <>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Ghi chú:
                  </Typography>
                  <Typography variant="body2">
                    {paymentFromState.notes}
                  </Typography>
                </>
              )}
            </Stack>

            {/* Form Stripe */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Thông tin thẻ (Stripe)
              </Typography>
              <Box
                ref={cardElementRef}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid #ddd",
                  minHeight: 50,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Thông tin thẻ được xử lý an toàn bởi Stripe. Chúng tôi không lưu
                trữ số thẻ của bạn.
              </Typography>
            </Box>

            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={2}
              sx={{ mt: 4 }}
            >
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Quay lại
              </Button>
              <Button
                variant="contained"
                startIcon={<FiLock />}
                onClick={handlePay}
                disabled={loading || !clientSecret}
              >
                {loading ? (
                  <CircularProgress size={22} />
                ) : (
                  "Thanh toán ngay"
                )}
              </Button>
            </Stack>
          </>
        )}
      </StyledPaper>
    </Container>
  );
};

export default PaymentPage;