import { IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string

  @ApiPropertyOptional({ example: '(63) 99999-9999' })
  @IsOptional()
  @IsString()
  phonePrimary?: string

  @ApiPropertyOptional({ example: '(63) 98888-8888' })
  @IsOptional()
  @IsString()
  phoneSecondary?: string

  @ApiPropertyOptional({ example: 'Palmas' })
  @IsOptional()
  @IsString()
  city?: string

  @ApiPropertyOptional({ example: 'TO' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string

  @ApiPropertyOptional({ example: 'Quadra 304 Sul, Alameda 5' })
  @IsOptional()
  @IsString()
  address?: string

  @ApiPropertyOptional({ example: 'Plano Diretor Sul' })
  @IsOptional()
  @IsString()
  neighborhood?: string

  @ApiPropertyOptional({ example: 'Quadra 304 Sul' })
  @IsOptional()
  @IsString()
  block?: string

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @IsString()
  lotNumber?: string

  @ApiPropertyOptional({ example: '12A' })
  @IsOptional()
  @IsString()
  streetNumber?: string

  @ApiPropertyOptional({ example: 'Casa, Apto 302, Bloco B' })
  @IsOptional()
  @IsString()
  complement?: string

  @ApiPropertyOptional({ example: '77021-504' })
  @IsOptional()
  @IsString()
  postalCode?: string

  @ApiPropertyOptional({ example: 'https://storage.example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string

  @ApiPropertyOptional({
    example: '63999990000',
    description: 'Número WhatsApp — apenas dígitos, sem +55. Ex: 63999990000',
  })
  @IsOptional()
  @IsString()
  whatsapp?: string
}
