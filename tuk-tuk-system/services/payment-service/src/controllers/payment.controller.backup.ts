import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import paymentModel from '../models/payment.model';
import mpesaService from '../services/mpesa.service';
import airtelService from '../services/airtel.service';
import paypalService from '../services/paypal.service';
import cryptoService from '../services/crypto.service';
import stripeService from '../services/stripe.service';
import logger from '../utils/logger';
import axios from 'axios';

export class PaymentController {
  async initiatePayment(req: Request, res: Response) {
    try {
      const { 
        bookingId, 
        amount, 
        paymentMethod, 
        phoneNumber, 
        userId,
        currency = 'USD',
        returnUrl,
        cancelUrl 
      } = req.body;

      if (!bookingId || !amount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: bookingId, amount, paymentMethod',
        });
      }

      const paymentId = `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;

      // M-Pesa STK Push
      if (paymentMethod === 'mpesa') {
        if (!phoneNumber) {
          return res.status(400).json({
            success: false,
            message: 'Phone number required for M-Pesa',
          });
        }

        const paymentResponse = await mpesaService.initiateSTKPush({
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

        return res.json({
          success: true,
          message: 'M-Pesa STK push sent successfully',
          data: {
            paymentId,
            checkoutRequestId: paymentResponse.CheckoutRequestID,
          },
        });
      }

      // Airtel Money STK Push
      else if (paymentMethod === 'airtel') {
        if (!phoneNumber) {
          return res.status(400).json({
            success: false,
            message: 'Phone number required for Airtel Money',
          });
        }

        const paymentResponse = await airtelService.initiateSTKPush({
          phoneNumber,
          amount,
          reference: bookingId,
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
          transaction_id: paymentResponse.data.transaction.id,
          provider_response: paymentResponse,
        });

        return res.json({
          success: true,
          message: 'Airtel Money STK push sent successfully',
          data: {
            paymentId,
            transactionId: paymentResponse.data.transaction.id,
          },
        });
      }

      // PayPal Checkout
      else if (paymentMethod === 'paypal') {
        const finalReturnUrl = returnUrl || `${process.env.FRONTEND_URL}/payment/paypal/success`;
        const finalCancelUrl = cancelUrl || `${process.env.FRONTEND_URL}/payment/paypal/cancel`;

        const order = await paypalService.createOrder(
          amount,
          currency,
          finalReturnUrl,
          finalCancelUrl
        );

        const approvalLink = order.links.find(link => link.rel === 'approve');

        await paymentModel.create({
          payment_id: paymentId,
          booking_id: bookingId,
          user_id: userId,
          amount,
          currency,
          payment_method: 'paypal',
          status: 'pending',
          provider: 'paypal',
          paypal_order_id: order.id,
          payment_url: approvalLink?.href,
          provider_response: order,
          expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
        });

        return res.json({
          success: true,
          message: 'PayPal order created successfully',
          data: {
            paymentId,
            orderId: order.id,
            approvalUrl: approvalLink?.href,
          },
        });
      }

      // Cryptocurrency (Coinbase Commerce)
      else if (paymentMethod === 'crypto') {
        const charge = await cryptoService.createCharge(
          amount,
          currency,
          `EAA Tuk-Tuk Booking ${bookingId}`,
          { booking_id: bookingId, payment_id: paymentId }
        );

        await paymentModel.create({
          payment_id: paymentId,
          booking_id: bookingId,
          user_id: userId,
          amount,
          currency,
          payment_method: 'crypto',
          status: 'pending',
          provider: 'coinbase',
          crypto_charge_id: charge.id,
          crypto_charge_code: charge.code,
          payment_url: charge.hosted_url,
          provider_response: charge,
          expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });

        return res.json({
          success: true,
          message: 'Crypto payment charge created successfully',
          data: {
            paymentId,
            chargeId: charge.id,
            chargeCode: charge.code,
            hostedUrl: charge.hosted_url,
            pricing: charge.pricing,
          },
        });
      }

      // Card Payment (Stripe)
      else if (paymentMethod === 'card') {
        const paymentIntent = await stripeService.createPaymentIntent(
          amount,
          currency,
          { booking_id: bookingId, payment_id: paymentId }
        );

        await paymentModel.create({
          payment_id: paymentId,
          booking_id: bookingId,
          user_id: userId,
          amount,
          currency,
          payment_method: 'card',
          status: 'pending',
          provider: 'stripe',
          stripe_payment_intent_id: paymentIntent.id,
          provider_response: paymentIntent,
        });

        return res.json({
          success: true,
          message: 'Card payment intent created successfully',
          data: {
            paymentId,
            clientSecret: paymentIntent.client_secret,
            publishableKey: stripeService.getPublishableKey(),
          },
        });
      }

      else {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method. Supported: mpesa, airtel, paypal, crypto, card',
        });
      }

    } catch (error: any) {
      logger.error('Payment initiation error:', error);
      return res.status(500).json({
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

      // Query real-time status for pending payments
      if (payment.status === 'processing' || payment.status === 'pending') {
        if (payment.provider === 'mpesa' && payment.checkout_request_id) {
          try {
            const statusResponse = await mpesaService.querySTKPushStatus(
              payment.checkout_request_id
            );
            
            if (statusResponse.ResultCode === '0') {
              await paymentModel.updateStatus(
                paymentId,
                'completed',
                statusResponse.TransactionID
              );
              payment.status = 'completed';
              payment.transaction_id = statusResponse.TransactionID;
            } else if (statusResponse.ResultCode !== '1032') {
              await paymentModel.updateStatus(paymentId, 'failed');
              payment.status = 'failed';
            }
          } catch (error) {
            logger.error('M-Pesa status query failed:', error);
          }
        }

        else if (payment.provider === 'airtel' && payment.transaction_id) {
          try {
            const statusResponse = await airtelService.queryTransactionStatus(
              payment.transaction_id
            );
            
            const status = statusResponse.status.toLowerCase();
            if (status === 'success' || status === 'ts') {
              await paymentModel.updateStatus(
                paymentId,
                'completed',
                payment.transaction_id
              );
              payment.status = 'completed';
            } else if (status === 'failed' || status === 'tf') {
              await paymentModel.updateStatus(paymentId, 'failed');
              payment.status = 'failed';
            }
          } catch (error) {
            logger.error('Airtel status query failed:', error);
          }
        }

        else if (payment.provider === 'paypal' && payment.paypal_order_id) {
          try {
            const orderDetails = await paypalService.getOrderDetails(
              payment.paypal_order_id
            );
            
            if (orderDetails.status === 'COMPLETED') {
              const capture = orderDetails.purchase_units[0]?.payments?.captures[0];
              await paymentModel.updateStatus(
                paymentId,
                'completed',
                capture?.id
              );
              payment.status = 'completed';
            } else if (orderDetails.status === 'VOIDED' || orderDetails.status === 'EXPIRED') {
              await paymentModel.updateStatus(paymentId, 'failed');
              payment.status = 'failed';
            }
          } catch (error) {
            logger.error('PayPal status query failed:', error);
          }
        }

        else if (payment.provider === 'coinbase' && payment.crypto_charge_id) {
          try {
            const chargeDetails = await cryptoService.getCharge(
              payment.crypto_charge_id
            );
            
            const mappedStatus = cryptoService.mapChargeStatus(chargeDetails.timeline);
            if (mappedStatus === 'SUCCESS') {
              await paymentModel.updateStatus(paymentId, 'completed');
              payment.status = 'completed';
            } else if (mappedStatus === 'FAILED') {
              await paymentModel.updateStatus(paymentId, 'failed');
              payment.status = 'failed';
            }
          } catch (error) {
            logger.error('Crypto status query failed:', error);
          }
        }

        else if (payment.provider === 'stripe' && payment.stripe_payment_intent_id) {
          try {
            const paymentIntent = await stripeService.getPaymentIntent(
              payment.stripe_payment_intent_id
            );
            
            const mappedStatus = stripeService.mapPaymentIntentStatus(paymentIntent.status);
            if (mappedStatus === 'SUCCESS') {
              await paymentModel.updateStatus(paymentId, 'completed', paymentIntent.id);
              payment.status = 'completed';
            } else if (paymentIntent.status === 'canceled') {
              await paymentModel.updateStatus(paymentId, 'failed');
              payment.status = 'failed';
            }
          } catch (error) {
            logger.error('Stripe status query failed:', error);
          }
        }
      }

      return res.json({
        success: true,
        data: {
          paymentId: payment.payment_id,
          bookingId: payment.booking_id,
          status: payment.status,
          amount: parseFloat(payment.amount.toString()),
          currency: payment.currency,
          paymentMethod: payment.payment_method,
          transactionId: payment.transaction_id,
          paymentUrl: payment.payment_url,
          createdAt: payment.created_at,
          completedAt: payment.completed_at,
          expiresAt: payment.expires_at,
        },
      });
    } catch (error: any) {
      logger.error('Get payment status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get payment status',
      });
    }
  }

  async handleMpesaCallback(req: Request, res: Response) {
    try {
      const { Body } = req.body;
      const callback = Body.stkCallback;

      const payment = await paymentModel.findByCheckoutRequestId(
        callback.CheckoutRequestID
      );

      if (!payment) {
        logger.warn('Payment not found for M-Pesa callback:', callback.CheckoutRequestID);
        return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      const status = callback.ResultCode === 0 ? 'completed' : 'failed';
      let transactionId: string | undefined;

      if (callback.ResultCode === 0 && callback.CallbackMetadata) {
        const mpesaReceiptNumber = callback.CallbackMetadata.Item.find(
          (item: any) => item.Name === 'MpesaReceiptNumber'
        );
        transactionId = mpesaReceiptNumber?.Value;
      }

      await paymentModel.update(payment.payment_id, {
        status,
        transaction_id: transactionId,
        callback_data: callback,
        error_message: callback.ResultDesc,
      });

      // Notify booking service
      if (status === 'completed') {
        try {
          await axios.post(
            `${process.env.BOOKING_SERVICE_URL}/api/bookings/${payment.booking_id}/payment-success`,
            {
              paymentId: payment.payment_id,
              transactionId,
              amount: payment.amount,
            }
          );
        } catch (error) {
          logger.error('Failed to notify booking service:', error);
        }
      }

      logger.info('M-Pesa callback processed:', { paymentId: payment.payment_id, status });

      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error: any) {
      logger.error('M-Pesa callback error:', error);
      return res.json({ ResultCode: 1, ResultDesc: 'Failed' });
    }
  }

  async handleAirtelCallback(req: Request, res: Response) {
    try {
      const { transaction } = req.body;

      const payment = await paymentModel.findByTransactionId(transaction.id);

      if (!payment) {
        logger.warn('Payment not found for Airtel callback:', transaction.id);
        return res.json({ status: 'SUCCESS', message: 'Accepted' });
      }

      const status = transaction.status.toLowerCase() === 'ts' ? 'completed' : 'failed';

      await paymentModel.update(payment.payment_id, {
        status,
        transaction_id: transaction.airtel_money_id,
        callback_data: transaction,
        error_message: transaction.message,
      });

      // Notify booking service
      if (status === 'completed') {
        try {
          await axios.post(
            `${process.env.BOOKING_SERVICE_URL}/api/bookings/${payment.booking_id}/payment-success`,
            {
              paymentId: payment.payment_id,
              transactionId: transaction.airtel_money_id,
              amount: payment.amount,
            }
          );
        } catch (error) {
          logger.error('Failed to notify booking service:', error);
        }
      }

      logger.info('Airtel callback processed:', { paymentId: payment.payment_id, status });

      return res.json({ status: 'SUCCESS', message: 'Accepted' });
    } catch (error: any) {
      logger.error('Airtel callback error:', error);
      return res.json({ status: 'FAILED', message: 'Processing error' });
    }
  }

  async handlePayPalWebhook(req: Request, res: Response) {
    try {
      const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';
      const headers = req.headers;
      const body = req.body;

      // Verify webhook signature
      const isValid = await paypalService.verifyWebhookSignature(
        webhookId,
        headers,
        body
      );

      if (!isValid) {
        logger.warn('Invalid PayPal webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const eventType = body.event_type;
      const resource = body.resource;

      // Handle PAYMENT.CAPTURE.COMPLETED
      if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        
        if (orderId) {
          const payment = await paymentModel.findByPayPalOrderId(orderId);
          
          if (payment) {
            await paymentModel.update(payment.payment_id, {
              status: 'completed',
              transaction_id: resource.id,
              callback_data: body,
            });

            // Notify booking service
            try {
              await axios.post(
                `${process.env.BOOKING_SERVICE_URL}/api/bookings/${payment.booking_id}/payment-success`,
                {
                  paymentId: payment.payment_id,
                  transactionId: resource.id,
                  amount: payment.amount,
                }
              );
            } catch (error) {
              logger.error('Failed to notify booking service:', error);
            }

            logger.info('PayPal payment completed:', { paymentId: payment.payment_id });
          }
        }
      }

      return res.json({ status: 'SUCCESS' });
    } catch (error: any) {
      logger.error('PayPal webhook error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  async handleCryptoWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-cc-webhook-signature'] as string;
      const rawBody = JSON.stringify(req.body);

      // Verify webhook signature
      const isValid = cryptoService.verifyWebhookSignature(signature, rawBody);

      if (!isValid) {
        logger.warn('Invalid crypto webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = req.body.event;
      const charge = event.data;

      const payment = await paymentModel.findByCryptoChargeId(charge.id);

      if (!payment) {
        logger.warn('Payment not found for crypto webhook:', charge.id);
        return res.json({ status: 'SUCCESS' });
      }

      const mappedStatus = cryptoService.mapChargeStatus(charge.timeline);
      
      if (mappedStatus === 'SUCCESS') {
        const confirmedPayment = charge.payments?.find((p: any) => p.status === 'CONFIRMED');
        
        await paymentModel.update(payment.payment_id, {
          status: 'completed',
          transaction_id: confirmedPayment?.transaction_id,
          callback_data: event,
        });

        // Notify booking service
        try {
          await axios.post(
            `${process.env.BOOKING_SERVICE_URL}/api/bookings/${payment.booking_id}/payment-success`,
            {
              paymentId: payment.payment_id,
              transactionId: confirmedPayment?.transaction_id,
              amount: payment.amount,
            }
          );
        } catch (error) {
          logger.error('Failed to notify booking service:', error);
        }

        logger.info('Crypto payment completed:', { paymentId: payment.payment_id });
      } else if (mappedStatus === 'FAILED') {
        await paymentModel.update(payment.payment_id, {
          status: 'failed',
          callback_data: event,
        });
      }

      return res.json({ status: 'SUCCESS' });
    } catch (error: any) {
      logger.error('Crypto webhook error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  async handleStripeWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const rawBody = req.body;

      // Verify webhook signature
      const event = stripeService.verifyWebhookSignature(rawBody, signature);

      // Handle different event types
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        
        const payment = await paymentModel.findByStripePaymentIntentId(paymentIntent.id);

        if (payment) {
          await paymentModel.update(payment.payment_id, {
            status: 'completed',
            transaction_id: paymentIntent.id,
            callback_data: event,
          });

          // Notify booking service
          try {
            await axios.post(
              `${process.env.BOOKING_SERVICE_URL}/api/bookings/${payment.booking_id}/payment-success`,
              {
                paymentId: payment.payment_id,
                transactionId: paymentIntent.id,
                amount: payment.amount,
              }
            );
          } catch (error) {
            logger.error('Failed to notify booking service:', error);
          }

          logger.info('Stripe payment completed:', { paymentId: payment.payment_id });
        }
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as any;
        
        const payment = await paymentModel.findByStripePaymentIntentId(paymentIntent.id);

        if (payment) {
          await paymentModel.update(payment.payment_id, {
            status: 'failed',
            error_message: paymentIntent.last_payment_error?.message,
            callback_data: event,
          });

          logger.info('Stripe payment failed:', { paymentId: payment.payment_id });
        }
      }

      return res.json({ received: true });
    } catch (error: any) {
      logger.error('Stripe webhook error:', error);
      return res.status(400).json({ error: error.message });
    }
  }

  async capturePayPalPayment(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const payment = await paymentModel.findByPayPalOrderId(orderId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      const captureResult = await paypalService.captureOrder(orderId);

      await paymentModel.update(payment.payment_id, {
        status: 'completed',
        transaction_id: captureResult.id,
        provider_response: captureResult,
      });

      // Notify booking service
      try {
        await axios.post(
          `${process.env.BOOKING_SERVICE_URL}/api/bookings/${payment.booking_id}/payment-success`,
          {
            paymentId: payment.payment_id,
            transactionId: captureResult.id,
            amount: payment.amount,
          }
        );
      } catch (error) {
        logger.error('Failed to notify booking service:', error);
      }

      return res.json({
        success: true,
        message: 'PayPal payment captured successfully',
        data: {
          paymentId: payment.payment_id,
          transactionId: captureResult.id,
        },
      });
    } catch (error: any) {
      logger.error('PayPal capture error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to capture PayPal payment',
      });
    }
  }

  async getBookingPayments(req: Request, res: Response) {
    try {
      const { bookingId } = req.params;

      const payments = await paymentModel.findByBookingId(bookingId);

      return res.json({
        success: true,
        data: payments.map((payment) => ({
          paymentId: payment.payment_id,
          amount: parseFloat(payment.amount.toString()),
          currency: payment.currency,
          paymentMethod: payment.payment_method,
          status: payment.status,
          transactionId: payment.transaction_id,
          createdAt: payment.created_at,
          completedAt: payment.completed_at,
        })),
      });
    } catch (error: any) {
      logger.error('Get booking payments error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get booking payments',
      });
    }
  }
}

export default new PaymentController();
