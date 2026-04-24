import { IsString, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class PhoneSendOtpDto {
  @ApiProperty({
    example: '+5563999990000',
    description: 'Número de telefone no formato internacional: +55DDDNUMERO',
  })
  @IsString()
  @Matches(/^\+55\d{10,11}$/, {
    message: 'Telefone inválido. Use o formato +55DDDNUMERO (ex: +5563999990000)',
  })
  phone: string
}
