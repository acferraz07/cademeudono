import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { AnnouncementStatus, AnnouncementType, PetSize, Species } from '@prisma/client'
import { Type } from 'class-transformer'

export class FilterAnnouncementsDto {
  @ApiPropertyOptional({ enum: AnnouncementType })
  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType

  @ApiPropertyOptional({ enum: AnnouncementStatus, default: AnnouncementStatus.ACTIVE })
  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus

  @ApiPropertyOptional({ enum: Species })
  @IsOptional()
  @IsEnum(Species)
  species?: Species

  @ApiPropertyOptional({ enum: PetSize })
  @IsOptional()
  @IsEnum(PetSize)
  size?: PetSize

  @ApiPropertyOptional({ example: 'TO' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string

  @ApiPropertyOptional({ example: 'Palmas' })
  @IsOptional()
  @IsString()
  city?: string

  @ApiPropertyOptional({ example: 'Plano Diretor Sul' })
  @IsOptional()
  @IsString()
  neighborhood?: string

  @ApiPropertyOptional({ example: -10.184, description: 'Latitude para busca por raio' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number

  @ApiPropertyOptional({ example: -48.334, description: 'Longitude para busca por raio' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number

  @ApiPropertyOptional({ example: 10, description: 'Raio em km para busca geográfica' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  radiusKm?: number

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20
}
