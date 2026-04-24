import { IsString, IsUUID, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ActivateTagDto {
  @ApiProperty({
    example: 'CMD-ST-202604-000001-X7K9',
    description: 'Código de ativação impresso no card dentro da embalagem (formato CMD-ST-AAAAMM-000001-AB12)',
  })
  @IsString()
  @Matches(
    /^CMD-(ST|GPS)-\d{6}-\d{6}-[A-Z0-9]{4}$/,
    { message: 'Formato inválido. Esperado: CMD-ST-202604-000001-X7K9' },
  )
  code: string

  @ApiProperty({ description: 'ID do pet ao qual a tag será vinculada' })
  @IsUUID()
  petId: string
}
