import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdatePetHealthDto {
  @ApiPropertyOptional({ example: 'up_to_date', enum: ['up_to_date', 'outdated', 'unknown'] })
  @IsOptional()
  @IsString()
  vaccinationStatus?: string

  @ApiPropertyOptional({ example: '2024-01-10' })
  @IsOptional()
  @IsDateString()
  lastVaccinationDate?: string

  @ApiPropertyOptional({ example: 'up_to_date', enum: ['up_to_date', 'outdated', 'unknown'] })
  @IsOptional()
  @IsString()
  dewormingStatus?: string

  @ApiPropertyOptional({ example: '2024-01-10' })
  @IsOptional()
  @IsDateString()
  lastDewormingDate?: string

  @ApiPropertyOptional({ example: ['Leishmaniose'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preexistingConditions?: string[]

  @ApiPropertyOptional({ example: 'Enalapril 2,5mg — 1x ao dia' })
  @IsOptional()
  @IsString()
  continuousMedications?: string

  @ApiPropertyOptional({ example: 'Frango, alguns anti-inflamatórios' })
  @IsOptional()
  @IsString()
  allergies?: string

  @ApiPropertyOptional({ example: 'Evitar esforço físico intenso' })
  @IsOptional()
  @IsString()
  specialCare?: string

  @ApiPropertyOptional({ example: 'Dr. Roberto Alves' })
  @IsOptional()
  @IsString()
  vetName?: string

  @ApiPropertyOptional({ example: '(63) 99999-0000' })
  @IsOptional()
  @IsString()
  vetPhone?: string

  @ApiPropertyOptional({ example: 'Clínica VetPalmas' })
  @IsOptional()
  @IsString()
  vetClinic?: string

  @ApiPropertyOptional({ example: 'PetShop Amigo Fiel' })
  @IsOptional()
  @IsString()
  petShop?: string

  @ApiPropertyOptional({ example: 'DEA 1.1+' })
  @IsOptional()
  @IsString()
  bloodType?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  generalObservations?: string
}
