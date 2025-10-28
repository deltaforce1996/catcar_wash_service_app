import type { ApiSuccessResponse } from "~/types";
import type {
  FirmwareLatestResponse,
  UploadFirmwareResponse,
  FirmwareType,
} from "~/types/firmware.type";
import { BaseApiClient } from "../bases/base-api-client";

export class FirmwareApiService extends BaseApiClient {
  /**
   * Upload carwash firmware (2 files: HW + QR)
   * POST /api/v1/firmwares/upload-carwash
   */
  async uploadCarwashFirmware(
    files: File[]
  ): Promise<ApiSuccessResponse<UploadFirmwareResponse>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await this.post<ApiSuccessResponse<UploadFirmwareResponse>>(
      "api/v1/firmwares/upload-carwash",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  }

  /**
   * Upload helmet firmware (2 files: HW + QR)
   * POST /api/v1/firmwares/upload-helmet
   */
  async uploadHelmetFirmware(
    files: File[]
  ): Promise<ApiSuccessResponse<UploadFirmwareResponse>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await this.post<ApiSuccessResponse<UploadFirmwareResponse>>(
      "api/v1/firmwares/upload-helmet",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  }

  /**
   * Get latest firmware by type
   * GET /api/v1/firmwares/latest?type=carwash
   * GET /api/v1/firmwares/latest?type=helmet
   */
  async getLatestFirmware(
    type: FirmwareType
  ): Promise<ApiSuccessResponse<FirmwareLatestResponse>> {
    const response = await this.get<ApiSuccessResponse<FirmwareLatestResponse>>(
      `api/v1/firmwares/latest?type=${type}`
    );
    return response;
  }
}
