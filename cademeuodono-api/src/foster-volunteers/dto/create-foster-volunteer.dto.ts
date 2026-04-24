import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class CreateFosterVolunteerDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  name: string

  @ApiProperty({ example: '63999990000' })
  @IsString()
  phone: string

  @ApiProperty({ example: 'TO' })
  @IsString()
  state: string

  @ApiProperty({ example: 'Palmas' })
  @IsString()
  city: string

  @ApiPropertyOptional({ example: 'Plano Diretor Sul' })
  @IsOptional()
  @IsString()
  neighborhood?: string

  @ApiProperty({ example: 'house', enum: ['house', 'apartment'] })
  @IsString()
  housingType: string

  @ApiProperty()
  @IsBoolean()
  hasOtherPets: boolean

  @ApiProperty()
  @IsBoolean()
  acceptsDogs: boolean

  @ApiProperty()
  @IsBoolean()
  acceptsCats: boolean

  @ApiProperty({ example: ['SMALL', 'MEDIUM'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  acceptedSizes: string[]

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  maxPets: number

  @ApiProperty({ example: 'immediate', enum: ['immediate', 'occasional'] })
  @IsString()
  availability: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  experience?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string
}
