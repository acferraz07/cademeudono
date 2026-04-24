import { IsEmail } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ForgotPasswordDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string
}
