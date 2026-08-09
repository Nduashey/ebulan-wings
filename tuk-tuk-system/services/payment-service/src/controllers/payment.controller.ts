import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import paymentModel from '../models/payment.model';
import mpesaService from '../services/mpesa.service';
import airtelService from '../services/airtel.service';
import paypalService from '../services/paypal.service';
import paystackService from '../services/paystack.service';
import directCryptoService from '../services/directCrypto.service';
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
        email,
        userId,
        currency = 'USD',
        returnUrl,
        cancelUrl,
        cryptoCurrency = 'BTC'
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
          email: email || undefined,
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

      // Paystack (Card, Bank, USSD, Mobile Money)
      else if (paymentMethod === 'paystack') {
        if (!email) {
          return res.status(400).json({
            success: false,
            message: 'Email required for Paystack payment',
          });
        }

        const reference = `${paymentId}-${Date.now()}`;
        
        const transaction = await paystackService.initializeTransaction(
          email,
          amount,
          reference,
          { booking_id: bookingId, payment_id: paymentId },
          `${process.env.FRONTEND_URL}/payment/paystack/callback`
        );

        await paymentModel.create({
          payment_id: paymentId,
          booking_id: bookingId,
          user_id: userId,
          amount,
          currency: currency || 'NGN',
          payment_method: 'paystack',
          email,
          status: 'pending',
          provider: 'paystack',
          paystack_reference: reference,
          payment_url: transaction.data.authorization_url,
          provider_response: transaction,
          expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });

        return res.json({
          success: true,
          message: 'Paystack payment initialized successfully',
          data: {
            paymentId,
            reference,
            authorizationUrl: transaction.data.authorization_url,
            accessCode: transaction.data.access_code,
          },
        });
      }

      // Direct Cryptocurrency (BTC, ETH, USDT)
      else if (paymentMethod === 'crypto') {
        if (!['BTC', 'ETH', 'USDT'].includes(cryptoCurrency)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid cryptocurrency. Supported: BTC, ETH, USDT',
          });
        }

        // Convert amount to USD if needed
        let amountUSD = amount;
        if (currency !== 'USD') {
          // TODO: Add currency conversion
          // For now assume amount is already in USD
        }

        const cryptoDetails = await directCryptoService.createPaymentDetails(amountUSD);

        const selectedCrypto = cryptoCurrency.toLowerCase() as 'btc' | 'eth' | 'usdt';
        const cryptoData = cryptoDetails[selectedCrypto];

        await paymentModel.create({
          payment_id: paymentId,
          booking_id: bookingId,
          user_id: userId,
          amount,
          currency: 'USD',
          payment_method: 'crypto',
          email: email || undefined,
          status: 'pending',
          provider: 'blockchain',
          crypto_currency: cryptoCurrency,
          crypto_wallet_address: cryptoData.address,
          crypto_amount: cryptoDetails.rates[selectedCrypto],
          provider_response: cryptoDetails,
          expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });

        return res.json({
          success: true,
          message: 'Crypto payment created successfully',
          data: {
            paymentId,
            currency: cryptoCurrency,
            address: cryptoData.address,
            qrCode: cryptoData.qrCode,
            amount: cryptoDetails.rates[selectedCrypto],
            amountUSD: cryptoDetails.amountUSD,
            network: cryptoCurrency === 'USDT' ? cryptoData.network : undefined,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        });
      }

      else {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method. Supported: mpesa, airtel, paypal, paystack, crypto',
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

        else if (payment.provider === 'paystack' && payment.paystack_reference) {
          try {
            const verification = await paystackService.verifyTransaction(
              payment.paystack_reference
            );
            
            const mappedStatus = paystackService.mapTransactionStatus(verification.data.status);
            if (mappedStatus === 'completed') {
              await paymentModel.updateStatus(paymentId, 'completed', verification.data.reference);
              payment.status = 'completed';
            } else if (mappedStatus === 'failed') {
              await paymentModel.updateStatus(paymentId, 'failed');
              payment.status = 'failed';
            }
          } catch (error) {
            logger.error('Paystack status query failed:', error);
          }
        }

        else if (payment.provider === 'blockchain' && payment.crypto_currency && payment.crypto_amount) {
          try {
            const verification = await directCryptoService.verifyPayment(
              payment.crypto_currency as 'BTC' | 'ETH' | 'USDT',
              payment.crypto_amount,
              payment.crypto_currency === 'BTC' ? 1 : 6 // 1 conf for BTC, 6 for ETH/USDT
            );
            
            if (verification.verified && verification.transaction) {
              await paymentModel.update(paymentId, {
                status: 'completed',
                crypto_tx_hash: verification.transaction.hash,
              });
              payment.status = 'completed';
              payment.crypto_tx_hash = verification.transaction.hash;
            }
          } catch (error) {
            logger.error('Crypto verification failed:', error);
          }
        }
      }

      const response: any = {
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
      };

      // Add crypto-specific details if applicable
      if (payment.payment_method === 'crypto' && payment.crypto_currency) {
        response.cryptoDetails = {
          currency: payment.crypto_currency,
          address: payment.crypto_wallet_address,
          amount: payment.crypto_amount,
          txHash: payment.crypto_tx_hash,
        };
      }

      return res.json({
        success: true,
        data: response,
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

  async handlePaystackWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const rawBody = JSON.stringify(req.body);

      // Verify webhook signature
      const isValid = paystackService.verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        logger.warn('Invalid Paystack webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = req.body.event;
      const data = req.body.data;

      if (event === 'charge.success') {
        const payment = await paymentModel.findByPaystackReference(data.reference);

        if (payment) {
          await paymentModel.update(payment.payment_id, {
            status: 'completed',
            transaction_id: data.id.toString(),
            callback_data: req.body,
          });

          // Notify booking service
          try {
            await axios.post(
              `${process.env.BOOKING_SERVICE_URL}/api/bookings/${payment.booking_id}/payment-success`,
              {
                paymentId: payment.payment_id,
                transactionId: data.id.toString(),
                amount: payment.amount,
              }
            );
          } catch (error) {
            logger.error('Failed to notify booking service:', error);
          }

          logger.info('Paystack payment completed:', { paymentId: payment.payment_id });
        }
      } else if (event === 'charge.failed') {
        const payment = await paymentModel.findByPaystackReference(data.reference);

        if (payment) {
          await paymentModel.update(payment.payment_id, {
            status: 'failed',
            error_message: data.gateway_response,
            callback_data: req.body,
          });

          logger.info('Paystack payment failed:', { paymentId: payment.payment_id });
        }
      }

      return res.json({ status: 'SUCCESS' });
    } catch (error: any) {
      logger.error('Paystack webhook error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
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

  async verifyCryptoPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { txHash } = req.body;

      const payment = await paymentModel.findByPaymentId(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      if (payment.payment_method !== 'crypto') {
        return res.status(400).json({
          success: false,
          message: 'Not a crypto payment',
        });
      }

      // Manually verify with transaction hash if provided
      if (txHash) {
        await paymentModel.update(paymentId, {
          crypto_tx_hash: txHash,
          status: 'processing', // Will be verified by background job
        });

        return res.json({
          success: true,
          message: 'Transaction hash recorded. Verification in progress.',
          data: { paymentId, txHash },
        });
      }

      // Auto-verify
      if (payment.crypto_currency && payment.crypto_amount) {
        const verification = await directCryptoService.verifyPayment(
          payment.crypto_currency as 'BTC' | 'ETH' | 'USDT',
          payment.crypto_amount,
          payment.crypto_currency === 'BTC' ? 1 : 6
        );

        if (verification.verified && verification.transaction) {
          await paymentModel.update(paymentId, {
            status: 'completed',
            crypto_tx_hash: verification.transaction.hash,
          });

          // Notify booking service
          try {
            await axios.post(
              `${process.env.BOOKING_SERVICE_URL}/api/bookings/${payment.booking_id}/payment-success`,
              {
                paymentId: payment.payment_id,
                transactionId: verification.transaction.hash,
                amount: payment.amount,
              }
            );
          } catch (error) {
            logger.error('Failed to notify booking service:', error);
          }

          return res.json({
            success: true,
            message: 'Crypto payment verified successfully',
            data: {
              paymentId,
              txHash: verification.transaction.hash,
              confirmations: verification.transaction.confirmations,
            },
          });
        }
      }

      return res.json({
        success: false,
        message: 'Payment not yet confirmed on blockchain',
      });
    } catch (error: any) {
      logger.error('Crypto verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify crypto payment',
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
