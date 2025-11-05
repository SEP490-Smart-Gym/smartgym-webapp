import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box, Stepper, Step, StepLabel, Card, CardContent, CardMedia, Typography,
  IconButton, TextField, Button, Stack, Grid, Divider, Paper, useTheme, styled,
  Container, CircularProgress, Snackbar, Alert
} from "@mui/material";
import {
  FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiCreditCard,
  FiArrowLeft, FiArrowRight, FiLock
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

  // Giữ lại item đầu tiên, quantity = 1
  useEffect(() => {
    if (SINGLE_SERVICE && cartItems.length > 1) {
      setCartItems([{ ...cartItems[0], quantity: 1 }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bước: Cart (0) → Payment (1) → Confirmation (2)
  const steps = ["Cart", "Payment", "Confirmation"];
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [discount, setDiscount] = useState(0);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setActiveStep((prev) => prev + 1);
      setLoading(false);
      setSnackbar({ open: true, message: "Step completed successfully!", severity: "success" });
    }, 1000);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleQuantityChange = useCallback((id, newQuantity) => {
    if (SINGLE_SERVICE) {
      // Cố định quantity = 1
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

  // ❌ Không có shipping → phí ship = 0
  const shipping = 0;
  const tax = calculateSubtotal * 0.1;
  const total = Math.max(0, calculateSubtotal + shipping + tax - discount);

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

  const renderQuantityUI = (item) => {
    if (SINGLE_SERVICE) {
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" disabled>
            <FiMinus />
          </IconButton>
          <TextField
            size="small"
            value={1}
            inputProps={{ readOnly: true }}
            sx={{ width: 60 }}
          />
          <IconButton size="small" disabled>
            <FiPlus />
          </IconButton>
        </Stack>
      );
    }
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton
          size="small"
          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          <FiMinus />
        </IconButton>
        <TextField
          size="small"
          value={item.quantity}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            handleQuantityChange(item.id, value);
          }}
          inputProps={{ min: 1, max: item.stock }}
          sx={{ width: 60 }}
        />
        <IconButton
          size="small"
          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
          disabled={item.quantity >= item.stock}
        >
          <FiPlus />
        </IconButton>
      </Stack>
    );
  };

  const renderStepContent = (step) => {
    switch (step) {
      // Cart
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

                          {/* Khóa số lượng = 1 */}
                          {/* {renderQuantityUI(item)} */}

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
                  <Button
                    variant="contained"
                    startIcon={<FiCreditCard />}
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={cartItems.length === 0}
                  >
                    Proceed to Checkout
                  </Button>
                </Stack>
              </StyledPaper>
            </Grid>
          </Grid>
        );

      // Payment
      case 1:
        return (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <PaymentForm />
          </StyledPaper>
        );

      // Confirmation
      case 2:
        return (
          <StyledPaper>
            <Stack spacing={3} alignItems="center">
              <CircularProgress size={60} sx={{ color: "success.main" }} />
              <Typography variant="h5">Order Confirmed!</Typography>
              <Typography color="text.secondary" align="center">
                Thank you for your purchase. Your order number is #12345.
                We'll send you an email with tracking information once your order ships.
              </Typography>
              <Button
                variant="contained"
                startIcon={<FiShoppingBag />}
                onClick={() => setActiveStep(0)}
              >
                Continue Shopping
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

      {/* Bước: Cart → Payment → Confirmation */}
      <CheckoutSteps activeStep={activeStep} steps={steps} />
      {renderStepContent(activeStep)}

      {/* Ẩn nút điều hướng trên màn hình Confirmation (index 2) */}
      {activeStep !== 2 && (
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
            endIcon={activeStep === 1 ? <FiLock /> : <FiArrowRight />}
            onClick={handleNext}
            disabled={loading || (activeStep === 0 && cartItems.length === 0)}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === 1 ? (
              "Place Order"
            ) : (
              "Continue"
            )}
          </Button>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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
