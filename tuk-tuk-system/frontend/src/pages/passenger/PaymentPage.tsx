import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import paymentService from '../../services/paymentService';

const steps = ['Select Payment Method', 'Payment Details', 'Complete Payment'];

// Stripe component wrapper
function StripeCardForm({ clientSecret, onSuccess, onError }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    setProcessing(false);

    if (result.error) {
      onError(result.error.message);
    } else {
      onSuccess(result.paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </Box>
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!stripe || processing}
      >
        {processing ? <CircularProgress size={24} /> : 'Pay Now'}
      </Button>
    </form>
  );
}

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState(500); // Default amount
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [stripePromise, setStripePromise] = useState<any>(null);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(event.target.value);
    setError('');
  };

  const initiatePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        bookingId: bookingId || 'BOOK-123',
        amount,
        paymentMethod,
        currency,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      };

      if (paymentMethod === 'mpesa' || paymentMethod === 'airtel') {
        if (!phoneNumber) {
          setError('Phone number is required');
          setLoading(false);
          return;
        }
        payload.phoneNumber = phoneNumber;
      }

      const response = await paymentService.initiatePayment(payload);

      if (response.success) {
        setPaymentData(response.data);

        // Handle different payment methods
        if (paymentMethod === 'paypal' && response.data.approvalUrl) {
          window.location.href = response.data.approvalUrl;
        } else if (paymentMethod === 'crypto' && response.data.hostedUrl) {
          window.location.href = response.data.hostedUrl;
        } else if (paymentMethod === 'card') {
          const stripe = await loadStripe(response.data.publishableKey);
          setStripePromise(stripe);
          handleNext();
        } else {
          handleNext();
          startPollingStatus(response.data.paymentId);
        }
      } else {
        setError(response.message || 'Failed to initiate payment');
      }
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const startPollingStatus = (paymentId: string) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await paymentService.getPaymentStatus(paymentId);
        if (statusResponse.success) {
          const status = statusResponse.data.status;
          setPaymentStatus(status);

          if (status === 'completed') {
            clearInterval(interval);
            setTimeout(() => {
              navigate(`/booking/${bookingId}/success`);
            }, 2000);
          } else if (status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 3000);

    setTimeout(() => clearInterval(interval), 120000); // Stop after 2 minutes
  };

  const renderPaymentMethodStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Your Payment Method
      </Typography>
      <FormControl component="fieldset" fullWidth>
        <RadioGroup value={paymentMethod} onChange={handlePaymentMethodChange}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <FormControlLabel
                value="mpesa"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      M-Pesa
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pay via M-Pesa STK Push
                    </Typography>
                  </Box>
                }
              />
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <FormControlLabel
                value="airtel"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      Airtel Money
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pay via Airtel Money
                    </Typography>
                  </Box>
                }
              />
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <FormControlLabel
                value="card"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      Credit/Debit Card
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pay securely with your card via Stripe
                    </Typography>
                  </Box>
                }
              />
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <FormControlLabel
                value="paypal"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      PayPal
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pay with your PayPal account
                    </Typography>
                  </Box>
                }
              />
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <FormControlLabel
                value="crypto"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      Cryptocurrency
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pay with Bitcoin, Ethereum, or USDT
                    </Typography>
                  </Box>
                }
              />
            </CardContent>
          </Card>
        </RadioGroup>
      </FormControl>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!paymentMethod}
        >
          Next
        </Button>
      </Box>
    </Box>
  );

  const renderPaymentDetailsStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            inputProps={{ min: 1 }}
          />
        </Grid>

        {(paymentMethod === 'mpesa' || paymentMethod === 'airtel') && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number"
              placeholder="254712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              helperText="Enter your phone number in international format"
            />
          </Grid>
        )}

        {(paymentMethod === 'paypal' || paymentMethod === 'crypto' || paymentMethod === 'card') && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Currency"
              select
              SelectProps={{ native: true }}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="KES">KES</option>
            </TextField>
          </Grid>
        )}
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={handleBack}>Back</Button>
        <Button
          variant="contained"
          onClick={initiatePayment}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
        </Button>
      </Box>
    </Box>
  );

  const renderPaymentProcessingStep = () => {
    if (paymentMethod === 'card' && paymentData && stripePromise) {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Enter Card Details
          </Typography>
          <Elements stripe={stripePromise}>
            <StripeCardForm
              clientSecret={paymentData.clientSecret}
              onSuccess={(paymentIntent: any) => {
                setPaymentStatus('completed');
                setTimeout(() => {
                  navigate(`/booking/${bookingId}/success`);
                }, 2000);
              }}
              onError={(error: string) => {
                setError(error);
                setPaymentStatus('failed');
              }}
            />
          </Elements>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      );
    }

    return (
      <Box textAlign="center">
        <Typography variant="h6" gutterBottom>
          Processing Payment
        </Typography>

        {paymentMethod === 'mpesa' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Please check your phone for the M-Pesa STK push prompt and enter your PIN to complete the payment.
          </Alert>
        )}

        {paymentMethod === 'airtel' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Please check your phone for the Airtel Money prompt and confirm the payment.
          </Alert>
        )}

        {paymentStatus === '' && (
          <Box>
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Waiting for payment confirmation...
            </Typography>
          </Box>
        )}

        {paymentStatus === 'processing' && (
          <Box>
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Processing your payment...
            </Typography>
          </Box>
        )}

        {paymentStatus === 'completed' && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Payment completed successfully! ✅
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Redirecting...
            </Typography>
          </Box>
        )}

        {paymentStatus === 'failed' && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              Payment failed. Please try again.
            </Alert>
            <Button variant="outlined" onClick={() => setActiveStep(0)}>
              Try Again
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Complete Your Payment
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && renderPaymentMethodStep()}
        {activeStep === 1 && renderPaymentDetailsStep()}
        {activeStep === 2 && renderPaymentProcessingStep()}
      </Paper>
    </Container>
  );
}
