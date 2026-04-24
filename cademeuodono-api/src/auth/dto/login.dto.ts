import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string

  @ApiProperty({ example: 'SenhaForte@123' })
  @IsString()
  @MinLength(8)
  password: string
}
