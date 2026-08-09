import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { validateBooking } from '../utils/validation';
import logger from '../utils/logger';

export class BookingController {
  async createGuestBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = validateBooking(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message)
        });
      }

      const bookingId = `EBW-${uuidv4().split('-')[0].toUpperCase()}`;
      
      const result = await pool.query(
        `INSERT INTO bookings (
          booking_id, service_type, pickup_location, dropoff_location,
          phone, scheduled_date, scheduled_time, notes, is_guest, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          bookingId,
          value.serviceType,
          value.pickupLocation,
          value.dropoffLocation,
          value.phone,
          value.scheduledDate,
          value.scheduledTime,
          value.notes || null,
          true,
          'pending'
        ]
      );

      logger.info(`Guest booking created: ${bookingId}`);

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        bookingId,
        booking: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  async createMemberBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = validateBooking(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message)
        });
      }

      const bookingId = `EBW-${uuidv4().split('-')[0].toUpperCase()}`;
      const userId = req.body.userId || null;
      
      const result = await pool.query(
        `INSERT INTO bookings (
          booking_id, service_type, pickup_location, dropoff_location,
          phone, scheduled_date, scheduled_time, notes, is_guest, user_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          bookingId,
          value.serviceType,
          value.pickupLocation,
          value.dropoffLocation,
          value.phone,
          value.scheduledDate,
          value.scheduledTime,
          value.notes || null,
          false,
          userId,
          'pending'
        ]
      );

      logger.info(`Member booking created: ${bookingId} for user: ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        bookingId,
        booking: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;

      const result = await pool.query(
        'SELECT * FROM bookings WHERE booking_id = $1',
        [bookingId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        booking: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, status, serviceType } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = 'SELECT * FROM bookings WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      if (serviceType) {
        query += ` AND service_type = $${paramIndex++}`;
        params.push(serviceType);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(Number(limit), offset);

      const result = await pool.query(query, params);
      const countResult = await pool.query('SELECT COUNT(*) FROM bookings');

      res.json({
        success: true,
        bookings: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBookingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const result = await pool.query(
        'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE booking_id = $2 RETURNING *',
        [status, bookingId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      logger.info(`Booking ${bookingId} status updated to ${status}`);

      res.json({
        success: true,
        message: 'Booking status updated',
        booking: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      const format = (req.query.format as string) || 'pdf';

      // Get booking from database
      const result = await pool.query(
        'SELECT * FROM bookings WHERE booking_id = $1',
        [bookingId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      const booking = result.rows[0];

      // Import ReceiptGenerator dynamically to avoid circular dependency
      const { ReceiptGenerator } = await import('../utils/receipt.generator');

      if (format === 'pdf') {
        const pdfStream = ReceiptGenerator.generatePDF(booking);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=booking-${bookingId}.pdf`);
        
        pdfStream.pipe(res);
      } else if (format === 'txt') {
        const txtContent = ReceiptGenerator.generateTXT(booking);
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=booking-${bookingId}.txt`);
        
        res.send(txtContent);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid format. Use "pdf" or "txt"'
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

export default new BookingController();
