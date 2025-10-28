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

export interface ManifestJson {
  version: string;
  carwash?: FirmwareVariants;
  helmet?: FirmwareVariants;
  uploaded_at: string;
  updated_at?: string;
}

export interface FirmwareLatestResponse {
  version: string;
  files: FirmwareVariants;
}

export interface FirmwareVersionsResponse {
  type: 'carwash' | 'helmet';
  versions: string[];
}
