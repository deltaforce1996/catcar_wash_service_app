import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  parseFilename,
  validateVersionMatch,
  validateTypeMatch,
  validateVariants,
  getLatestVersion,
} from './utils/filename-parser.util';
import { ManifestJson, FirmwareVariants, FirmwareLatestResponse, UploadFirmwareResponse } from './dtos';

@Injectable()
export class FirmwaresService {
  private readonly logger = new Logger(FirmwaresService.name);
  private readonly firmwaresPath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Path to firmwares directory
    this.firmwaresPath = path.join(process.cwd(), 'public', 'firmwares');

    // Base URL for accessing files
    this.baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';

    this.logger.log('FirmwaresService initialized');
    this.logger.log(`Firmwares path: ${this.firmwaresPath}`);
    this.logger.log(`Base URL: ${this.baseUrl}`);
  }

  /**
   * Upload firmware files (2 files: HW and QR)
   */
  async uploadFirmware(files: Express.Multer.File[], type: 'carwash' | 'helmet'): Promise<UploadFirmwareResponse> {
    this.logger.log(`Uploading ${type} firmware with ${files.length} files`);

    // Validate we have exactly 2 files
    if (files.length !== 2) {
      throw new Error('Expected exactly 2 files (HW and QR variants)');
    }

    // Parse filenames
    const parsed1 = parseFilename(files[0].originalname);
    const parsed2 = parseFilename(files[1].originalname);

    // Validate type matches
    validateTypeMatch(parsed1, parsed2);

    // Validate type matches requested type
    if (parsed1.type !== type) {
      throw new Error(`File type mismatch. Expected '${type}' but got '${parsed1.type}'`);
    }

    // Validate versions match
    validateVersionMatch(parsed1, parsed2);

    // Validate we have both HW and QR variants
    validateVariants(parsed1, parsed2);

    const version = parsed1.swVersion;
    const versionFolder = path.join(this.firmwaresPath, `v${version}`);

    // Create version folder if it doesn't exist
    await fs.mkdir(versionFolder, { recursive: true });
    this.logger.log(`Version folder: ${versionFolder}`);

    // Process and save files
    const filesMetadata: FirmwareVariants = {} as FirmwareVariants;

    for (const file of files) {
      const parsed = parseFilename(file.originalname);
      const filePath = path.join(versionFolder, file.originalname);

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);
      this.logger.log(`Saved file: ${filePath}`);

      // Calculate SHA256
      const sha256 = await this.calculateSHA256(filePath);

      // Build metadata
      const metadata = {
        filename: file.originalname,
        url: `${this.baseUrl}/firmwares/v${version}/${file.originalname}`,
        sha256,
        size: file.size,
        hw_version: parsed.hwVersion,
      };

      // Assign to correct variant
      if (parsed.variant === 'HW') {
        filesMetadata.hw = metadata;
      } else {
        filesMetadata.qr = metadata;
      }
    }

    // Update manifest.json
    await this.updateManifest(version, type, filesMetadata);

    return {
      version,
      type,
      files: filesMetadata,
      message: `${type} firmware version ${version} uploaded successfully`,
    };
  }

  /**
   * Get latest firmware for a specific type
   */
  async getLastFirmware(type: 'carwash' | 'helmet'): Promise<FirmwareLatestResponse> {
    this.logger.log(`Getting latest ${type} firmware`);

    // Get latest version that has this firmware type
    const latestVersion = await this.getLatestVersionForType(type);

    if (!latestVersion) {
      throw new NotFoundException(`No ${type} firmware versions found`);
    }

    // Read manifest
    const manifestPath = path.join(this.firmwaresPath, `v${latestVersion}`, 'manifest.json');

    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: ManifestJson = JSON.parse(manifestContent);

      // Ensure the firmware type exists in manifest
      const firmwareFiles = manifest[type];
      if (!firmwareFiles) {
        throw new NotFoundException(`No ${type} firmware found in version ${latestVersion}`);
      }

      return {
        version: latestVersion,
        files: firmwareFiles,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`Manifest not found for version ${latestVersion}`);
      }
      throw error;
    }
  }

  /**
   * Get latest version folder
   */
  private async getLatestVersionFolder(): Promise<string | null> {
    try {
      const entries = await fs.readdir(this.firmwaresPath, {
        withFileTypes: true,
      });

      // Get all version folders (format: v1.0.0)
      const versionFolders = entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('v'))
        .map((entry) => entry.name.substring(1)); // Remove 'v' prefix

      return getLatestVersion(versionFolders);
    } catch (error) {
      this.logger.error('Error reading firmwares directory', error);
      return null;
    }
  }

  /**
   * Get latest version folder that has specific firmware type
   */
  private async getLatestVersionForType(type: 'carwash' | 'helmet'): Promise<string | null> {
    try {
      const entries = await fs.readdir(this.firmwaresPath, {
        withFileTypes: true,
      });

      // Get all version folders (format: v1.0.0)
      const versionFolders = entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('v'))
        .map((entry) => entry.name.substring(1)); // Remove 'v' prefix

      // Filter versions that have the requested firmware type
      const versionsWithType: string[] = [];

      for (const version of versionFolders) {
        try {
          const manifestPath = path.join(this.firmwaresPath, `v${version}`, 'manifest.json');
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest: ManifestJson = JSON.parse(manifestContent);

          // Check if this version has the requested type
          if (manifest[type]) {
            versionsWithType.push(version);
          }
        } catch (error) {
          // Skip versions with missing or invalid manifests
          this.logger.warn(`Skipping version ${version}: ${error.message}`);
        }
      }

      // Return the latest version from filtered list
      return getLatestVersion(versionsWithType);
    } catch (error) {
      this.logger.error(`Error reading firmwares directory for type ${type}`, error);
      return null;
    }
  }

  /**
   * Calculate SHA256 hash of a file
   */
  private async calculateSHA256(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  /**
   * Update or create manifest.json in version folder
   */
  private async updateManifest(version: string, type: 'carwash' | 'helmet', files: FirmwareVariants): Promise<void> {
    const versionFolder = path.join(this.firmwaresPath, `v${version}`);
    const manifestPath = path.join(versionFolder, 'manifest.json');

    let manifest: ManifestJson;

    // Try to read existing manifest
    try {
      const existingContent = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(existingContent);
      manifest.updated_at = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Create new manifest if it doesn't exist
      manifest = {
        version,
        uploaded_at: new Date().toISOString(),
      };
    }

    // Update the specific type
    manifest[type] = files;

    // Write manifest
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    this.logger.log(`Manifest updated: ${manifestPath}`);
  }
}
