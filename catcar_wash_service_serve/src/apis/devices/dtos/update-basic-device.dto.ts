import { IsOptional, IsString } from 'class-validator';

export class UpdateDeviceBasicDto {
  @IsString()
  @IsOptional()
  name?: string;
}
