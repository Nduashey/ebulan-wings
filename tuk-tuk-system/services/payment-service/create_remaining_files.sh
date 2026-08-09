#!/bin/bash

# Payment Controller
cat > src/controllers/payment.controller.ts << 'EOF'
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import paymentModel from '../models/payment.model';
import mpesaService from '../services/mpesa.service';
import airtelService from '../services/airtel.service';
import logger from '../utils/logger';
import axios from 'axios';

export class PaymentController {
  async initiatePayment(req: Request, res: Response) {
    try {
      const { bookingId, amount, paymentMethod, phoneNumber, userId } = req.body;

      if (!bookingId || !amount || !paymentMethod || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      const paymentId = `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;

      let paymentResponse: any;
      let provider: 'mpesa' | 'airtel';

      if (paymentMethod === 'mpesa') {
        provider = 'mpesa';
        paymentResponse = await mpesaService.initiateSTKPush({
          phoneNumber,
          amount,
          accountReference: bookingId,
          transactionDesc: `Payment for booking ${bookingId}`,
        });

        await paymentModel.create({
          payment_id: paymentId,
          booking_id: bookingId,
          user_id: userId,
          amount,
          currency: 'KES',
          payment_method: 'mpesa',
          phone_number: phoneNumber,
          status: 'processing',
          provider: 'mpesa',
          merchant_request_id: paymentResponse.MerchantRequestID,
          checkout_request_id: paymentResponse.CheckoutRequestID,
          provider_response: paymentResponse,
        });
      } else if (paymentMethod === 'airtel') {
        provider = 'airtel';
        paymentResponse = await airtelService.initiateSTKPush({
          phoneNumber,
          amount,
          reference: paymentId,
          description: `Payment for booking ${bookingId}`,
        });

        await paymentModel.create({
          payment_id: paymentId,
          booking_id: bookingId,
          user_id: userId,
          amount,
          currency: 'KES',
          payment_method: 'airtel',
          phone_number: phoneNumber,
          status: 'processing',
          provider: 'airtel',
          transaction_id: paymentResponse.data?.transaction?.id,
          provider_response: paymentResponse,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method',
        });
      }

      // Notify booking service
      try {
        await axios.post(
          `${process.env.BOOKING_SERVICE_URL || 'http://booking-service:3002'}/api/internal/bookings/${bookingId}/payment-initiated`,
          {
            paymentId,
            amount,
            status: 'processing',
          }
        );
      } catch (error) {
        logger.warn(`Failed to notify booking service: ${error}`);
      }

      res.status(200).json({
        success: true,
        message: 'Payment initiated successfully',
        paymentId,
        provider,
        data: paymentResponse,
      });
    } catch (error: any) {
      logger.error(`Payment initiation error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to initiate payment',
      });
    }
  }

  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      const payment = await paymentModel.findByPaymentId(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      res.status(200).json({
        success: true,
        payment: {
          paymentId: payment.payment_id,
          bookingId: payment.booking_id,
          amount: payment.amount,
          status: payment.status,
          provider: payment.provider,
          transactionId: payment.transaction_id,
          createdAt: payment.created_at,
          completedAt: payment.completed_at,
        },
      });
    } catch (error: any) {
      logger.error(`Get payment status error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment status',
      });
    }
  }

  async getBookingPayments(req: Request, res: Response) {
    try {
      const { bookingId } = req.params;
      const payments = await paymentModel.findByBookingId(bookingId);

      res.status(200).json({
        success: true,
        payments: payments.map(p => ({
          paymentId: p.payment_id,
          amount: p.amount,
          status: p.status,
          provider: p.provider,
          transactionId: p.transaction_id,
          createdAt: p.created_at,
          completedAt: p.completed_at,
        })),
      });
    } catch (error: any) {
      logger.error(`Get booking payments error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get booking payments',
      });
    }
  }

  async handleMpesaCallback(req: Request, res: Response) {
    try {
      logger.info(`M-Pesa callback received: ${JSON.stringify(req.body)}`);

      const { Body } = req.body;
      const callback = Body?.stkCallback;

      if (!callback) {
        return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback data' });
      }

      const payment = await paymentModel.findByCheckoutRequestId(callback.CheckoutRequestID);

      if (!payment) {
        logger.warn(`Payment not found for CheckoutRequestID: ${callback.CheckoutRequestID}`);
        return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
      }

      if (callback.ResultCode === 0) {
        // Payment successful
        const metadata = callback.CallbackMetadata?.Item || [];
        const transactionId = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;

        await paymentModel.updateStatus(
          payment.payment_id,
          'completed',
          transactionId,
          callback
        );

        // Notify booking service
        try {
          await axios.post(
            `${process.env.BOOKING_SERVICE_URL || 'http://booking-service:3002'}/api/internal/bookings/${payment.booking_id}/payment-completed`,
            {
              paymentId: payment.payment_id,
              amount: payment.amount,
              transactionId,
            }
          );
        } catch (error) {
          logger.error(`Failed to notify booking service: ${error}`);
        }
      } else {
        // Payment failed
        await paymentModel.updateStatus(
          payment.payment_id,
          'failed',
          undefined,
          callback,
          callback.ResultDesc
        );

        // Notify booking service
        try {
          await axios.post(
            `${process.env.BOOKING_SERVICE_URL || 'http://booking-service:3002'}/api/internal/bookings/${payment.booking_id}/payment-failed`,
            {
              paymentId: payment.payment_id,
              error: callback.ResultDesc,
            }
          );
        } catch (error) {
          logger.error(`Failed to notify booking service: ${error}`);
        }
      }

      res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error: any) {
      logger.error(`M-Pesa callback error: ${error.message}`);
      res.status(200).json({ ResultCode: 1, ResultDesc: 'Failed to process callback' });
    }
  }

  async handleAirtelCallback(req: Request, res: Response) {
    try {
      logger.info(`Airtel callback received: ${JSON.stringify(req.body)}`);

      const { transaction } = req.body;

      if (!transaction?.id) {
        return res.status(400).json({ status: 'failed', message: 'Invalid callback data' });
      }

      const payment = await paymentModel.findByTransactionId(transaction.id);

      if (!payment) {
        logger.warn(`Payment not found for transaction ID: ${transaction.id}`);
        return res.status(200).json({ status: 'success' });
      }

      if (transaction.status === 'TS' || transaction.status_code === '200') {
        // Payment successful
        await paymentModel.updateStatus(
          payment.payment_id,
          'completed',
          transaction.airtel_money_id || transaction.id,
          transaction
        );

        // Notify booking service
        try {
          await axios.post(
            `${process.env.BOOKING_SERVICE_URL || 'http://booking-service:3002'}/api/internal/bookings/${payment.booking_id}/payment-completed`,
            {
              paymentId: payment.payment_id,
              amount: payment.amount,
              transactionId: transaction.airtel_money_id || transaction.id,
            }
          );
        } catch (error) {
          logger.error(`Failed to notify booking service: ${error}`);
        }
      } else {
        // Payment failed
        await paymentModel.updateStatus(
          payment.payment_id,
          'failed',
          transaction.id,
          transaction,
          transaction.message
        );

        // Notify booking service
        try {
          await axios.post(
            `${process.env.BOOKING_SERVICE_URL || 'http://booking-service:3002'}/api/internal/bookings/${payment.booking_id}/payment-failed`,
            {
              paymentId: payment.payment_id,
              error: transaction.message,
            }
          );
        } catch (error) {
          logger.error(`Failed to notify booking service: ${error}`);
        }
      }

      res.status(200).json({ status: 'success' });
    } catch (error: any) {
      logger.error(`Airtel callback error: ${error.message}`);
      res.status(200).json({ status: 'failed', message: 'Failed to process callback' });
    }
  }
}

export default new PaymentController();
EOF

echo "Created controller"
