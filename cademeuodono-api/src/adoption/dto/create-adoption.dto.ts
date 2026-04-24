import { IsBoolean, IsString, IsUUID, Matches, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateAdoptionDto {
  @ApiProperty({ example: 'uuid-do-pet' })
  @IsUUID()
  petId: string

  @ApiProperty({ example: 'João da Silva Santos' })
  @IsString()
  @MaxLength(150)
  fullName: string

  @ApiProperty({ example: '123.456.789-09', description: 'CPF do adotante (apenas números ou formatado)' })
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, {
    message: 'CPF inválido. Use o formato 000.000.000-00',
  })
  cpf: string

  @ApiProperty({ description: 'O adotante deve marcar como true para aceitar o termo' })
  @IsBoolean()
  acceptedTerm: boolean
}
