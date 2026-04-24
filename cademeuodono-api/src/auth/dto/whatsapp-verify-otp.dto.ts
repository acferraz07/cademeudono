import { IsString, Length, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class WhatsappVerifyOtpDto {
  @ApiProperty({ example: '+5563999990000' })
  @IsString()
  @Matches(/^\+55\d{10,11}$/, {
    message: 'WhatsApp inválido. Use o formato +55DDDNUMERO',
  })
  whatsapp: string

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'O código deve ter 6 dígitos numéricos' })
  code: string
}
