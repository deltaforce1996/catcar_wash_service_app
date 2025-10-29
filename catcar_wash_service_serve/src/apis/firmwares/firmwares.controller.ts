import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UseFilters,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FirmwaresService } from './firmwares.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleAuthGuard } from '../auth/guards/role-auth.guard';
import { RoleAdmin } from '../auth/decorators/roles.decorator';
import { AllExceptionFilter } from 'src/common';

interface SuccessResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@UseFilters(AllExceptionFilter)
@Controller('api/v1/firmwares')
export class FirmwaresController {
  constructor(private readonly firmwaresService: FirmwaresService) {}

  /**
   * Upload carwash firmware (Admin only)
   * POST /api/v1/firmwares/upload-carwash
   */
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @RoleAdmin()
  @Post('upload-carwash')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      fileFilter: (req, file, callback) => {
        if (!file.originalname.toLowerCase().endsWith('.bin')) {
          return callback(new BadRequestException('Only .bin files are allowed'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 2,
      },
    }),
  )
  async uploadCarwash(@UploadedFiles() files: Express.Multer.File[]): Promise<SuccessResponse<any>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (files.length !== 2) {
      throw new BadRequestException('Expected exactly 2 files (HW and QR variants)');
    }

    const result = await this.firmwaresService.uploadFirmware(files, 'carwash');

    return {
      success: true,
      data: result,
      message: result.message,
    };
  }

  /**
   * Upload helmet firmware (Admin only)
   * POST /api/v1/firmwares/upload-helmet
   */
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @RoleAdmin()
  @Post('upload-helmet')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      fileFilter: (req, file, callback) => {
        if (!file.originalname.toLowerCase().endsWith('.bin')) {
          return callback(new BadRequestException('Only .bin files are allowed'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 2,
      },
    }),
  )
  async uploadHelmet(@UploadedFiles() files: Express.Multer.File[]): Promise<SuccessResponse<any>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (files.length !== 2) {
      throw new BadRequestException('Expected exactly 2 files (HW and QR variants)');
    }

    const result = await this.firmwaresService.uploadFirmware(files, 'helmet');

    return {
      success: true,
      data: result,
      message: result.message,
    };
  }

  /**
   * Get list of all firmware versions
   * GET /api/v1/firmwares/list?type=carwash
   * GET /api/v1/firmwares/list?type=helmet
   */
  @Get('list')
  async getVersionsList(@Query('type') type: string): Promise<SuccessResponse<any>> {
    if (!type || (type !== 'carwash' && type !== 'helmet')) {
      throw new BadRequestException("Type parameter is required and must be 'carwash' or 'helmet'");
    }

    const result = await this.firmwaresService.getAllVersions(type);

    return {
      success: true,
      data: result,
      message: `${type} firmware versions retrieved successfully`,
    };
  }

  /**
   * Get latest firmware (Public endpoint for ESP32 devices)
   * GET /api/v1/firmwares/latest?type=carwash&version=1.2.3
   * GET /api/v1/firmwares/latest?type=helmet
   */
  @Get('latest')
  async getLatest(@Query('type') type: string, @Query('version') version?: string): Promise<SuccessResponse<any>> {
    if (!type || (type !== 'carwash' && type !== 'helmet')) {
      throw new BadRequestException("Type parameter is required and must be 'carwash' or 'helmet'");
    }

    const result = await this.firmwaresService.getLastFirmware(type, version);

    const message = version
      ? `${type} firmware version ${version} retrieved successfully`
      : `Latest ${type} firmware retrieved successfully`;

    return {
      success: true,
      data: result,
      message,
    };
  }
}
