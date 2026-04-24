import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { User } from '@prisma/client'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { FosterVolunteersService } from './foster-volunteers.service'
import { CreateFosterVolunteerDto } from './dto/create-foster-volunteer.dto'

@ApiTags('Lar Temporário')
@ApiBearerAuth('JWT')
@Controller('foster-volunteers')
export class FosterVolunteersController {
  constructor(private readonly fosterVolunteersService: FosterVolunteersService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar ou atualizar como voluntário de lar temporário' })
  @ApiResponse({ status: 201 })
  register(@CurrentUser() user: User, @Body() dto: CreateFosterVolunteerDto) {
    return this.fosterVolunteersService.register(user.id, dto)
  }

  @Get('me')
  @ApiOperation({ summary: 'Buscar meu cadastro de voluntário' })
  findMine(@CurrentUser() user: User) {
    return this.fosterVolunteersService.findMine(user.id)
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar meu cadastro de voluntário' })
  deactivate(@CurrentUser() user: User) {
    return this.fosterVolunteersService.deactivate(user.id)
  }
}
