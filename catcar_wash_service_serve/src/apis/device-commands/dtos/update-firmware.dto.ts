import { IsString, IsOptional } from 'class-validator';

export class UpdateFirmwareDto {
  @IsOptional()
  @IsString()
  version?: string;
}
