import { Router } from 'express';
import paymentController from '../controllers/payment.controller';

const router = Router();

// Public routes
router.post('/initiate', paymentController.initiatePayment);
router.get('/:paymentId/status', paymentController.getPaymentStatus);
router.get('/booking/:bookingId', paymentController.getBookingPayments);

// PayPal routes
router.post('/paypal/:orderId/capture', paymentController.capturePayPalPayment);

// Crypto verification
router.post('/crypto/:paymentId/verify', paymentController.verifyCryptoPayment);

// Callback/Webhook routes
router.post('/mpesa/callback', paymentController.handleMpesaCallback);
router.post('/airtel/callback', paymentController.handleAirtelCallback);
router.post('/paypal/webhook', paymentController.handlePayPalWebhook);
router.post('/paystack/webhook', paymentController.handlePaystackWebhook);

export default router;
