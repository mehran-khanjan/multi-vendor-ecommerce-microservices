// src/modules/notifications/dto/mark-read.dto.ts
import { IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class MarkReadDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  notificationIds: string[];
}

export class MarkAllReadDto {
  // No additional fields needed - will mark all for the user
}
