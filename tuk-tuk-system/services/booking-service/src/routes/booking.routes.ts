import { Router } from 'express';
import bookingController from '../controllers/booking.controller';

const router = Router();

// Guest booking route
router.post('/guest', (req, res, next) => bookingController.createGuestBooking(req, res, next));

// Member booking route (authenticated users)
router.post('/', (req, res, next) => bookingController.createMemberBooking(req, res, next));

// Get booking receipt (PDF or TXT)
router.get('/:bookingId/receipt', (req, res, next) => bookingController.getBookingReceipt(req, res, next));

// Get booking by ID
router.get('/:bookingId', (req, res, next) => bookingController.getBookingById(req, res, next));

// Get all bookings (admin)
router.get('/', (req, res, next) => bookingController.getAllBookings(req, res, next));

// Update booking status
router.patch('/:bookingId/status', (req, res, next) => bookingController.updateBookingStatus(req, res, next));

export default router;
