import { IsEnum, IsInt, Max, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { DeviceType } from '@prisma/client'
import { Type } from 'class-transformer'

export class GenerateBatchDto {
  @ApiProperty({ enum: DeviceType, example: DeviceType.SMART_TAG })
  @IsEnum(DeviceType)
  type: DeviceType

  @ApiProperty({ example: 5000, minimum: 1, maximum: 10000 })
  @IsInt()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  quantity: number
}
