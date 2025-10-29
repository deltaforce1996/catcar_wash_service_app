export interface FirmwareFileMetadata {
  filename: string;
  url: string;
  sha256: string;
  size: number;
  hw_version: string;
}

export interface FirmwareVariants {
  hw: FirmwareFileMetadata;
  qr: FirmwareFileMetadata;
}

export interface FirmwareLatestResponse {
  version: string;
  files: FirmwareVariants;
}

export interface FirmwareVersionsResponse {
  type: FirmwareType;
  versions: string[];
}

export interface UploadFirmwareResponse {
  version: string;
  type: "carwash" | "helmet";
  files: FirmwareVariants;
  message: string;
}

export type FirmwareType = "carwash" | "helmet";
