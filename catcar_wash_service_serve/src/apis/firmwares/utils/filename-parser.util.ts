import { BadRequestException } from '@nestjs/common';
import * as semver from 'semver';

export interface ParsedFilename {
  type: 'carwash' | 'helmet';
  variant: 'HW' | 'QR';
  hwVersion: string;
  swVersion: string;
  originalFilename: string;
}

/**
 * Parse firmware filename
 * Expected formats:
 * - HW variant: {type}_HW_{hw_version}_V{sw_version}.bin (e.g., carwash_HW_1.0_V1.0.0.bin)
 * - QR variant: {type}_QR_HW_{hw_version}_V{sw_version}.bin (e.g., carwash_QR_HW_1.0_V1.0.0.bin)
 */
export function parseFilename(filename: string): ParsedFilename {
  // Remove .bin extension
  const nameWithoutExt = filename.replace(/\.bin$/i, '');

  let type: string;
  let variant: string;
  let hwVersion: string;
  let swVersion: string;

  // Try HW pattern: {type}_HW_{hw_version}_V{sw_version}
  const hwPattern = /^(carwash|helmet)_HW_([\d.]+)_V([\d.]+)$/i;
  const hwMatch = nameWithoutExt.match(hwPattern);

  if (hwMatch) {
    [, type, hwVersion, swVersion] = hwMatch;
    variant = 'HW';
  } else {
    // Try QR pattern: {type}_QR_HW_{hw_version}_V{sw_version}
    const qrPattern = /^(carwash|helmet)_QR_HW_([\d.]+)_V([\d.]+)$/i;
    const qrMatch = nameWithoutExt.match(qrPattern);

    if (qrMatch) {
      [, type, hwVersion, swVersion] = qrMatch;
      variant = 'QR';
    } else {
      throw new BadRequestException(
        `Invalid filename format. Expected:\n` +
          `  HW: {type}_HW_{hw_version}_V{sw_version}.bin\n` +
          `  QR: {type}_QR_HW_{hw_version}_V{sw_version}.bin\n` +
          `Got: ${filename}`,
      );
    }
  }

  // Validate software version is valid semver
  if (!semver.valid(swVersion)) {
    throw new BadRequestException(
      `Invalid software version format. Must be valid semver (e.g., 1.0.0). Got: ${swVersion}`,
    );
  }

  // Validate type
  if (type.toLowerCase() !== 'carwash' && type.toLowerCase() !== 'helmet') {
    throw new BadRequestException(
      `Invalid type. Must be 'carwash' or 'helmet'. Got: ${type}`,
    );
  }

  // Validate variant
  if (variant.toUpperCase() !== 'HW' && variant.toUpperCase() !== 'QR') {
    throw new BadRequestException(
      `Invalid variant. Must be 'HW' or 'QR'. Got: ${variant}`,
    );
  }

  return {
    type: type.toLowerCase() as 'carwash' | 'helmet',
    variant: variant.toUpperCase() as 'HW' | 'QR',
    hwVersion,
    swVersion,
    originalFilename: filename,
  };
}

/**
 * Validate that two files have matching software versions
 */
export function validateVersionMatch(
  file1: ParsedFilename,
  file2: ParsedFilename,
): void {
  if (file1.swVersion !== file2.swVersion) {
    throw new BadRequestException(
      `Software version mismatch. File 1: ${file1.swVersion}, File 2: ${file2.swVersion}. Both files must have the same software version.`,
    );
  }
}

/**
 * Validate that two files have matching types
 */
export function validateTypeMatch(
  file1: ParsedFilename,
  file2: ParsedFilename,
): void {
  if (file1.type !== file2.type) {
    throw new BadRequestException(
      `Type mismatch. File 1: ${file1.type}, File 2: ${file2.type}. Both files must be of the same type.`,
    );
  }
}

/**
 * Validate that the files contain both HW and QR variants
 */
export function validateVariants(
  file1: ParsedFilename,
  file2: ParsedFilename,
): void {
  const variants = [file1.variant, file2.variant].sort();
  if (variants[0] !== 'HW' || variants[1] !== 'QR') {
    throw new BadRequestException(
      `Invalid variants. Expected one HW and one QR file. Got: ${file1.variant}, ${file2.variant}`,
    );
  }
}

/**
 * Get the latest version from a list of version strings
 */
export function getLatestVersion(versions: string[]): string | null {
  if (versions.length === 0) {
    return null;
  }

  // Filter valid semver versions
  const validVersions = versions.filter((v) => semver.valid(v));

  if (validVersions.length === 0) {
    return null;
  }

  // Sort descending and return the first (latest)
  return semver.rsort(validVersions)[0];
}
