export interface Payment {
  id?: number;
  payment_id: string;
  booking_id: string;
  user_id?: number;
  amount: number;
  currency: string;
  payment_method: 'mpesa' | 'airtel' | 'paypal' | 'paystack' | 'crypto';
  phone_number?: string;
  email?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  merchant_request_id?: string;
  checkout_request_id?: string;
  paypal_order_id?: string;
  paystack_reference?: string;
  crypto_currency?: 'BTC' | 'ETH' | 'USDT';
  crypto_wallet_address?: string;
  crypto_tx_hash?: string;
  crypto_amount?: number;
  payment_url?: string;
  provider: 'mpesa' | 'airtel' | 'paypal' | 'paystack' | 'blockchain';
  provider_response?: any;
  callback_data?: any;
  error_message?: string;
  created_at?: Date;
  updated_at?: Date;
  completed_at?: Date;
  expires_at?: Date;
}

export interface MPesaSTKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface MPesaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MPesaCallbackRequest {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: any;
        }>;
      };
    };
  };
}

export interface AirtelSTKPushRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
}

export interface AirtelSTKPushResponse {
  status: {
    code: string;
    message: string;
    result_code: string;
    transaction_id: string;
  };
  data: {
    transaction: {
      id: string;
      status: string;
    };
  };
}

export interface AirtelCallbackRequest {
  transaction: {
    id: string;
    status_code: string;
    status: string;
    message: string;
    airtel_money_id: string;
  };
}

export interface PayPalInitRequest {
  amount: number;
  currency?: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaystackInitRequest {
  email: string;
  amount: number;
  currency?: string;
}

export interface CryptoInitRequest {
  amount: number;
  currency?: string;
  cryptoCurrency: 'BTC' | 'ETH' | 'USDT';
}

export interface PaymentInitRequest {
  bookingId: string;
  amount: number;
  paymentMethod: 'mpesa' | 'airtel' | 'paypal' | 'paystack' | 'crypto';
  phoneNumber?: string;
  email?: string;
  userId?: number;
  currency?: string;
  returnUrl?: string;
  cancelUrl?: string;
  cryptoCurrency?: 'BTC' | 'ETH' | 'USDT';
}

export interface PaymentStatusResponse {
  paymentId: string;
  bookingId: string;
  status: string;
  amount: number;
  transactionId?: string;
  paymentUrl?: string;
  cryptoDetails?: {
    currency: string;
    address: string;
    qrCode: string;
    amount: number;
    txHash?: string;
  };
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}
