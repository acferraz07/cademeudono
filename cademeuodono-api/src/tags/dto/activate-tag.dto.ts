import { IsString, IsUUID, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ActivateTagDto {
  @ApiProperty({
    example: 'CMD-ST-00001',
    description: 'Código impresso na smart tag (formato CMD-ST-00001)',
  })
  @IsString()
  @Matches(/^CMD-ST-\d{5}$/, { message: 'Formato inválido. Esperado: CMD-ST-00001' })
  code: string

  @ApiProperty({ description: 'ID do pet ao qual a tag será vinculada' })
  @IsUUID()
  petId: string
}
