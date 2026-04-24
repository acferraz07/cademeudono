import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PetSex, PetSize, Species } from '@prisma/client'
import { Type } from 'class-transformer'

export class CreatePetDto {
  @ApiProperty({ example: 'Rex' })
  @IsString()
  @MaxLength(50)
  name: string

  @ApiProperty({ enum: Species, example: Species.DOG })
  @IsEnum(Species)
  species: Species

  @ApiPropertyOptional({ description: 'ID da raça (GET /breeds?species=DOG|CAT)' })
  @IsOptional()
  @IsUUID()
  breedId?: string

  @ApiPropertyOptional({ description: 'Nome da raça desnormalizado (preenchido automaticamente ao informar breedId)' })
  @IsOptional()
  @IsString()
  breedName?: string

  @ApiPropertyOptional({ example: 'Labrador Retriever', description: 'Campo livre para espécie "Outro"' })
  @IsOptional()
  @IsString()
  breed?: string

  @ApiPropertyOptional({ example: '2020-06-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string

  @ApiPropertyOptional({ example: 'Aproximadamente 3 anos' })
  @IsOptional()
  @IsString()
  ageEstimate?: string

  @ApiPropertyOptional({ enum: PetSex })
  @IsOptional()
  @IsEnum(PetSex)
  sex?: PetSex

  @ApiPropertyOptional({ enum: PetSize })
  @IsOptional()
  @IsEnum(PetSize)
  size?: PetSize

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  @Type(() => Number)
  weightKg?: number

  @ApiPropertyOptional({ example: ['marrom', 'branco'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coatColor?: string[]

  @ApiPropertyOptional({ example: 'castanho' })
  @IsOptional()
  @IsString()
  eyeColor?: string

  @ApiPropertyOptional({ example: 'curto' })
  @IsOptional()
  @IsString()
  coatType?: string

  @ApiPropertyOptional({ example: 'Mancha preta na pata dianteira esquerda' })
  @IsOptional()
  @IsString()
  specificMarks?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCastrated?: boolean

  @ApiPropertyOptional({ example: '956000012345678' })
  @IsOptional()
  @IsString()
  microchipNumber?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pedigreeNumber?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kennelName?: string

  @ApiPropertyOptional({ example: 'https://storage.example.com/pet-photo.jpg' })
  @IsOptional()
  @IsString()
  profilePhotoUrl?: string

  @ApiPropertyOptional({ example: ['docil', 'brincalhao'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  behavior?: string[]

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isLost?: boolean

  @ApiPropertyOptional({ default: false, description: 'Pet foi encontrado (procura-se tutor)' })
  @IsOptional()
  @IsBoolean()
  isFound?: boolean

  @ApiPropertyOptional({ default: false, description: 'Pet foi devolvido ao tutor' })
  @IsOptional()
  @IsBoolean()
  isReturned?: boolean

  @ApiPropertyOptional({ default: false, description: 'Urgente: em busca de lar temporário' })
  @IsOptional()
  @IsBoolean()
  isUrgentFoster?: boolean

  @ApiPropertyOptional({ example: '2024-03-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  lastSeenAt?: string

  @ApiPropertyOptional({ example: 'Praça central do bairro' })
  @IsOptional()
  @IsString()
  lastSeenLocation?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lostNotes?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secretMark?: string

  // ─── Adoção ───
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isForAdoption?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adoptionStory?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adoptionReason?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adoptionRequirements?: string

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isInFosterHome?: boolean

  @ApiPropertyOptional({ default: 'normal', enum: ['normal', 'urgent'] })
  @IsOptional()
  @IsString()
  adoptionUrgency?: string

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOng?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ongName?: string

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAdopted?: boolean

  // ─── PetMatch ───
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isForPetMatch?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  petMatchObjective?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  petMatchPreferences?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptsCrossbreeding?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  petMatchObservations?: string

  // ─── Saúde ───
  @ApiPropertyOptional({ example: 'em dia', enum: ['em dia', 'atrasada', 'desconhecida'] })
  @IsOptional()
  @IsString()
  vaccinationStatus?: string

  @ApiPropertyOptional({ example: 'em dia', enum: ['em dia', 'atrasada', 'desconhecida'] })
  @IsOptional()
  @IsString()
  dewormingStatus?: string

  @ApiPropertyOptional({ example: 'Enalapril 5mg, uma vez ao dia' })
  @IsOptional()
  @IsString()
  continuousMedications?: string

  @ApiPropertyOptional({ example: 'Dipirona, frango' })
  @IsOptional()
  @IsString()
  allergies?: string

  @ApiPropertyOptional({ example: 'Necessita de banho especial para pele sensível' })
  @IsOptional()
  @IsString()
  specialCare?: string

  // ─── Veterinário e serviços ───
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
}
