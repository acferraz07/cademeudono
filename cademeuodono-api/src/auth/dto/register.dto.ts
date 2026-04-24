import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MaxLength(100)
  fullName: string

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string

  @ApiProperty({ example: 'SenhaForte@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  password: string

  @ApiPropertyOptional({ example: '(63) 99999-9999' })
  @IsOptional()
  @IsString()
  phonePrimary?: string

  @ApiPropertyOptional({ description: 'Aceite dos Termos de Uso e Política de Privacidade (LGPD)' })
  @IsOptional()
  @IsBoolean()
  lgpdAccepted?: boolean
}
