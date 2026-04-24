import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateOrgProtectorDto {
  @ApiProperty({ enum: ['ONG', 'PROTETOR'], example: 'ONG' })
  @IsEnum(['ONG', 'PROTETOR'])
  type: 'ONG' | 'PROTETOR'

  @ApiProperty({ example: 'Anjos de 4 Patas' })
  @IsString()
  @MaxLength(100)
  name: string

  @ApiPropertyOptional({ example: '12.345.678/0001-90' })
  @IsOptional()
  @IsString()
  cnpj?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ example: '(63) 99999-1234' })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({ example: 'contato@ong.org.br' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagram?: string

  @ApiProperty({ example: 'TO' })
  @IsString()
  state: string

  @ApiProperty({ example: 'Palmas' })
  @IsString()
  city: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  neighborhood?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string

  @ApiPropertyOptional({ description: 'Informações de como doar' })
  @IsOptional()
  @IsString()
  donationInfo?: string

  @ApiPropertyOptional({ example: 'pix@ong.org.br' })
  @IsOptional()
  @IsString()
  pixKey?: string

  @ApiPropertyOptional({ example: ['DOG', 'CAT'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actingSpecies?: string[]

  @ApiPropertyOptional({ example: ['Palmas', 'Porto Nacional'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actingCities?: string[]
}
