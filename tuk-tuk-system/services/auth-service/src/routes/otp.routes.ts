import { Router } from 'express';
import { OTPController } from '../controllers/otp.controller';
import { validateRequest } from '../middleware/validateRequest';
import { otpSchema, verifyOTPSchema, resendOTPSchema } from '../validators/otp.validator';

const router = Router();
const otpController = new OTPController();

// Send OTP
router.post('/send/phone', validateRequest(otpSchema), otpController.sendPhoneOTP);
router.post('/send/email', validateRequest(otpSchema), otpController.sendEmailOTP);

// Verify OTP
router.post('/verify/phone', validateRequest(verifyOTPSchema), otpController.verifyPhoneOTP);
router.post('/verify/email', validateRequest(verifyOTPSchema), otpController.verifyEmailOTP);

// Resend OTP
router.post('/resend', validateRequest(resendOTPSchema), otpController.resendOTP);

export default router;
