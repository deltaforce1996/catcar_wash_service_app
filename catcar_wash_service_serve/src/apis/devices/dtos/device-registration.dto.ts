import { IsNotEmpty, IsString } from 'class-validator';

export class DeviceNeedRegisterDto {
  @IsString()
  @IsNotEmpty()
  chip_id: string;

  @IsString()
  @IsNotEmpty()
  mac_address: string;

  @IsString()
  @IsNotEmpty()
  firmware_version: string;
}
