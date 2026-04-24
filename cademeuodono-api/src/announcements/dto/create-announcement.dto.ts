import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AnnouncementType, PetSize, Species } from '@prisma/client'
import { Type } from 'class-transformer'

export class CreateAnnouncementDto {
  @ApiProperty({ enum: AnnouncementType, example: AnnouncementType.LOST })
  @IsEnum(AnnouncementType)
  type: AnnouncementType

  @ApiPropertyOptional({ description: 'ID do pet cadastrado na plataforma (opcional)' })
  @IsOptional()
  @IsUUID()
  petId?: string

  @ApiPropertyOptional({ example: 'Rex' })
  @IsOptional()
  @IsString()
  petName?: string

  @ApiProperty({ enum: Species, example: Species.DOG })
  @IsEnum(Species)
  species: Species

  @ApiPropertyOptional({ example: 'Labrador' })
  @IsOptional()
  @IsString()
  breed?: string

  @ApiPropertyOptional({ enum: PetSize })
  @IsOptional()
  @IsEnum(PetSize)
  size?: PetSize

  @ApiPropertyOptional({ example: ['marrom', 'branco'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coatColor?: string[]

  @ApiPropertyOptional({ example: 'castanho' })
  @IsOptional()
  @IsString()
  eyeColor?: string

  @ApiPropertyOptional({ example: 'Cicatriz na pata traseira direita' })
  @IsOptional()
  @IsString()
  specificMarks?: string

  @ApiPropertyOptional({ example: 'https://storage.example.com/foto.jpg' })
  @IsOptional()
  @IsString()
  petPhotoUrl?: string

  @ApiProperty({ example: 'TO' })
  @IsString()
  @MaxLength(2)
  state: string

  @ApiProperty({ example: 'Palmas' })
  @IsString()
  city: string

  @ApiPropertyOptional({ example: 'Plano Diretor Sul' })
  @IsOptional()
  @IsString()
  neighborhood?: string

  @ApiPropertyOptional({ example: 'Quadra 304 Sul' })
  @IsOptional()
  @IsString()
  block?: string

  @ApiPropertyOptional({ example: 'Alameda 5' })
  @IsOptional()
  @IsString()
  street?: string

  @ApiPropertyOptional({ example: 'Próximo ao Parque Cesamar' })
  @IsOptional()
  @IsString()
  locationNotes?: string

  @ApiPropertyOptional({ example: -10.184 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number

  @ApiPropertyOptional({ example: -48.334 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  eventDate: string

  @ApiProperty({ example: '(63) 99999-9999' })
  @IsString()
  contactPhone: string

  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional()
  @IsString()
  contactName?: string
}
