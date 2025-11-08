import { IsNotEmpty, IsString } from 'class-validator';

export class CancelEventLogDto {
  @IsString()
  @IsNotEmpty()
  eventLogId: string;
}
