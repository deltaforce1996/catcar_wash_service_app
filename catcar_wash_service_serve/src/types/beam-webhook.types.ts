// Beam Webhook Event Types
export type BeamWebhookEventType = 'charge.succeeded';
export type BeamPaymentMethodType =
  | 'CARD'
  | 'QR_PROMPT_PAY'
  | 'ALIPAY'
  | 'WECHAT_PAY'
  | 'TRUE_MONEY'
  | 'LINE_PAY'
  | 'SHOPEE_PAY'
  | 'BANGKOK_BANK_APP'
  | 'K_PLUS'
  | 'SCB_EASY'
  | 'KRUNGSRI_APP';

// Base webhook payload structure
export interface BeamWebhookPayload {
  merchantId: string;
  createdAt: string;
  updatedAt: string;
}

// Charge succeeded webhook payload
export interface BeamChargeSucceededPayload extends BeamWebhookPayload {
  chargeId: string;
  referenceId: string;
  status: 'SUCCEEDED';
  currency: string;
  amount: number;
  source: 'PAYMENT_LINK' | 'API' | 'STORE_LINK' | 'QR_PROMPT_PAY_LINK';
  sourceId: string;
  transactionTime: string;
  paymentMethod: {
    paymentMethodType: BeamPaymentMethodType;
    card?: {
      last4: string;
      brand: string;
    };
    cardInstallments?: any;
    qrPromptPay?: any;
    alipay?: any;
    weChatPay?: any;
    trueMoney?: any;
    linePay?: any;
    shopeePay?: any;
    bangkokBankApp?: any;
    kPlus?: any;
    scbEasy?: any;
    krungsriApp?: any;
  };
  failureCode: string;
  customer: {
    primaryPhone: {
      countryCode: string;
      number: string;
    };
    email: string;
    deliveryAddress: {
      contactName: string;
      phone: {
        countryCode: string;
        number: string;
      };
      address: {
        streetAddress: string;
        city: string;
        country: string;
        postCode: string;
      };
    };
  };
}

// Union type for all webhook payloads
export type BeamWebhookPayloadUnion = BeamChargeSucceededPayload;

// Webhook headers
export interface BeamWebhookHeaders {
  'x-beam-signature': string;
  'x-beam-event': BeamWebhookEventType;
  'content-type': string;
}
