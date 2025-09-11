import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface BeamCheckoutConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  webhookUrl?: string;
}

export interface ChargeData {
  amount: number;
  currency: string;
  referenceId: string;
  paymentMethod: {
    paymentMethodType: 'QR_PROMPT_PAY' | 'CARD' | 'ALIPAY' | 'LINE_PAY' | 'SHOPEE_PAY' | 'TRUE_MONEY' | 'WECHAT_PAY';
    qrPromptPay?: {
      expiryTime?: string;
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
  private tokenExpiresAt: Date | null = null;

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
    this.httpClient.interceptors.request.use(async (config) => {
      await this.ensureAuthenticated();
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
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
    return {
      apiUrl: this.configService.get<string>('BEAM_API_URL', 'https://api.beamcheckout.com'),
      clientId: this.configService.get<string>('BEAM_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('BEAM_CLIENT_SECRET') || '',
      webhookUrl: this.configService.get<string>('BEAM_WEBHOOK_URL') || '',
    };
  }

  /**
   * Authenticate with Beam Checkout API
   */
  async authenticate(): Promise<void> {
    const config = this.getBeamConfig();

    if (!config.clientId || !config.clientSecret) {
      throw new BadRequestException('Beam Checkout credentials not configured');
    }

    try {
      const response: AxiosResponse<{
        access_token: string;
        token_type: string;
        expires_in: number;
      }> = await axios.post(`${config.apiUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      this.logger.log('Successfully authenticated with Beam Checkout API');
    } catch (error: any) {
      this.logger.error('Failed to authenticate with Beam Checkout API', error.response?.data);
      throw new BadRequestException('Failed to authenticate with Beam Checkout API');
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt || this.tokenExpiresAt <= new Date()) {
      await this.authenticate();
    }
  }

  /**
   * Create a new charge
   */
  async createCharge(data: ChargeData): Promise<ChargeResult> {
    if (data.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (!data.referenceId) {
      throw new BadRequestException('Reference ID is required');
    }

    try {
      const payload = {
        amount: data.amount,
        currency: data.currency || 'THB',
        referenceId: data.referenceId,
        paymentMethod: data.paymentMethod,
        returnUrl: data.returnUrl,
      };

      const response: AxiosResponse<{
        actionRequired: string;
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
      }> = await this.httpClient.post('/api/v1/charges', payload);

      return {
        actionRequired: response.data.actionRequired as any,
        chargeId: response.data.chargeId,
        paymentMethodType: response.data.paymentMethodType,
        redirect: response.data.redirect,
        encodedImage: response.data.encodedImage,
      };
    } catch (error: any) {
      this.logger.error('Failed to create charge', error.response?.data);
      throw new BadRequestException('Failed to create charge');
    }
  }

  /**
   * Get charge status
   */
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
      this.logger.error('Failed to get charge status', error.response?.data);
      throw new BadRequestException('Failed to get charge status');
    }
  }

  /**
   * Cancel a charge
   */
  async cancelCharge(chargeId: string): Promise<void> {
    try {
      await this.httpClient.post(`/api/v1/charges/${chargeId}/cancel`);
      this.logger.log(`Charge ${chargeId} cancelled successfully`);
    } catch (error: any) {
      this.logger.error('Failed to cancel charge', error.response?.data);
      throw new BadRequestException('Failed to cancel charge');
    }
  }

  /**
   * Generate QR code as data URL
   */
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

  /**
   * Generate QR code as buffer
   */
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

  /**
   * Generate QR code as SVG string
   */
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
