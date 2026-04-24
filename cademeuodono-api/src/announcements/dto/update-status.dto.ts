import { IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { AnnouncementStatus } from '@prisma/client'

export class UpdateStatusDto {
  @ApiProperty({ enum: AnnouncementStatus })
  @IsEnum(AnnouncementStatus)
  status: AnnouncementStatus
}
