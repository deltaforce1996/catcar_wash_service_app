import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BeamPaymentMethodType } from 'src/types/beam-webhook.types';
import { BadRequestException } from 'src/errors';

export interface BeamCheckoutConfig {
  apiUrl: string;
  merchantId: string;
  secretKey: string;
  webhookUrl?: string;
}

export interface ChargeData {
  amount: number;
  currency: string;
  referenceId: string;
  paymentMethod: {
    paymentMethodType: BeamPaymentMethodType;
    qrPromptPay?: {
      expiresAt?: string;
    };
    card?: {
      cardHolderName: string;
      expiryMonth: number;
      expiryYear: number;
      pan: string;
      securityCode: string;
    };
  };
  returnUrl?: string;
}

export interface ChargeResult {
  actionRequired: 'NONE' | 'REDIRECT' | 'ENCODED_IMAGE';
  chargeId: string;
  paymentMethodType: string;
  redirect?: {
    redirectUrl: string;
  };
  encodedImage?: {
    expiry: string;
    imageBase64Encoded: string;
    rawData: string;
  };
}

export interface ChargeStatus {
  chargeId: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  amount: number;
  currency: string;
  referenceId: string;
  chargeSource: 'API' | 'PAYMENT_LINK' | 'STORE_LINK' | 'QR_PROMPT_PAY_LINK';
  createdAt: string;
  succeededAt?: string;
}

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

@Injectable()
export class BeamCheckoutService {
  private readonly logger = new Logger(BeamCheckoutService.name);
  private readonly httpClient: AxiosInstance;
  private accessToken: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const config = this.getBeamConfig();

    this.httpClient = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CatCar-Wash-Service/1.0',
      },
    });

    // Add request interceptor for authentication
    this.httpClient.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Basic ${this.accessToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(`Beam API Error: ${error.message}`, error.response?.data);
        throw error;
      },
    );
  }

  private getBeamConfig(): BeamCheckoutConfig {
    const config = {
      apiUrl: this.configService.get<string>('beamCheckout.apiUrl', 'https://playground.api.beamcheckout.com'),
      merchantId: '',
      secretKey: '',
      webhookUrl: this.configService.get<string>('beamCheckout.webhookUrl') || '',
    };
    return config;
  }

  authenticate(configOverride?: Partial<BeamCheckoutConfig>): void {
    const config = this.getBeamConfig();

    if (!configOverride) {
      throw new BadRequestException('Beam Checkout credentials not configured');
    }

    if (configOverride.merchantId === '' || configOverride.secretKey === '') {
      throw new BadRequestException('Beam Checkout credentials not configured');
    }

    if (configOverride) {
      config.merchantId = configOverride.merchantId as string;
      config.secretKey = configOverride.secretKey as string;
    }

    this.logger.debug(`Beam credentail merchantId set **********`);
    this.logger.debug(`Beam credentail secretKey set **********`);

    // Encode credentials for Basic Authentication
    const credentials = Buffer.from(`${config.merchantId}:${config.secretKey}`).toString('base64');
    this.accessToken = credentials;
  }

  private ensureAuthenticated(): void {
    throw Error("Not implemented yet because this is playground API and we don't need refresh token to authenticate");
  }

  async createCharge(data: ChargeData): Promise<ChargeResult> {
    if (data.amount <= 0) throw new BadRequestException('Amount must be greater than 0');
    if (!data.referenceId) throw new BadRequestException('Reference ID is required');
    try {
      const payload = {
        amount: data.amount,
        currency: data.currency || 'THB',
        referenceId: data.referenceId,
        paymentMethod: data.paymentMethod,
        returnUrl: data.returnUrl,
      };

      const response: AxiosResponse<ChargeResult> = await this.httpClient.post('/api/v1/charges', payload);

      return {
        actionRequired: response.data.actionRequired as any,
        chargeId: response.data.chargeId,
        paymentMethodType: response.data.paymentMethodType,
        redirect: response.data.redirect,
        encodedImage: response.data.encodedImage,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to create charge ErrorCode ${error.response?.data.error.errorCode} ${error.response?.data.error.message}`,
      );
    }
  }

  async getChargeStatus(chargeId: string): Promise<ChargeStatus> {
    try {
      const response: AxiosResponse<{
        chargeId: string;
        status: string;
        amount: number;
        currency: string;
        referenceId: string;
        chargeSource: string;
        createdAt: string;
        succeededAt?: string;
      }> = await this.httpClient.get(`/api/v1/charges/${chargeId}`);

      return {
        chargeId: response.data.chargeId,
        status: response.data.status as any,
        amount: response.data.amount,
        currency: response.data.currency,
        referenceId: response.data.referenceId,
        chargeSource: response.data.chargeSource as any,
        createdAt: response.data.createdAt,
        succeededAt: response.data.succeededAt,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to get charge status ErrorCode ${error.response?.data.error.errorCode} ${error.response?.data.error.message}`,
      );
    }
  }

  async cancelCharge(chargeId: string): Promise<void> {
    try {
      await this.httpClient.post(`/api/v1/charges/${chargeId}/cancel`);
      this.logger.log(`Charge ${chargeId} cancelled successfully`);
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to cancel charge ErrorCode ${error.response?.data.error.errorCode} ${error.response?.data.error.message}`,
      );
    }
  }

  async generateQRCodeDataUrl(data: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      const defaultOptions = {
        width: options.width || 256,
        margin: options.margin || 2,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#FFFFFF',
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      };

      return await QRCode.toDataURL(data, defaultOptions);
    } catch (error: any) {
      this.logger.error('Failed to generate QR code', error);
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  async generateQRCodeBuffer(data: string, options: QRCodeOptions = {}): Promise<Buffer> {
    try {
      const defaultOptions = {
        width: options.width || 256,
        margin: options.margin || 2,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#FFFFFF',
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      };

      return await QRCode.toBuffer(data, defaultOptions);
    } catch (error: any) {
      this.logger.error('Failed to generate QR code buffer', error);
      throw new BadRequestException('Failed to generate QR code buffer');
    }
  }

  async generateQRCodeSVG(data: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      const defaultOptions = {
        width: options.width || 256,
        margin: options.margin || 2,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#FFFFFF',
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      };

      return await QRCode.toString(data, { type: 'svg', ...defaultOptions });
    } catch (error: any) {
      this.logger.error('Failed to generate QR code SVG', error);
      throw new BadRequestException('Failed to generate QR code SVG');
    }
  }
}
