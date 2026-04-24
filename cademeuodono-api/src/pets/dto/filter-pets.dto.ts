import { IsEnum, IsOptional, IsUUID } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { PetSize, Species } from '@prisma/client'

export class FilterPetsDto {
  @ApiPropertyOptional({ enum: Species })
  @IsOptional()
  @IsEnum(Species)
  species?: Species

  @ApiPropertyOptional({ description: 'UUID da raça (retornado pelo GET /breeds)' })
  @IsOptional()
  @IsUUID()
  breedId?: string

  @ApiPropertyOptional({ enum: PetSize })
  @IsOptional()
  @IsEnum(PetSize)
  size?: PetSize
}
