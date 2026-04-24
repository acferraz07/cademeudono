import { IsString, IsUUID, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ActivateDeviceDto {
  @ApiProperty({ example: 'CMD-ST-202604-000001-AB12' })
  @IsString()
  code: string

  @ApiProperty({ example: 'uuid-do-pet' })
  @IsUUID()
  petId: string

  @ApiPropertyOptional({ description: 'IMEI do rastreador GPS (obrigatório para GPS_TRACKER)' })
  @IsOptional()
  @IsString()
  imei?: string

  @ApiPropertyOptional({ description: 'Número SIM do rastreador GPS' })
  @IsOptional()
  @IsString()
  simNumber?: string
}
