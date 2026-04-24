import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { User } from '@prisma/client'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsersService } from './users.service'
import { UpdateUserDto } from './dto/update-user.dto'

@ApiTags('Usuários')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna o perfil do usuário autenticado' })
  getMe(@CurrentUser() user: User) {
    return this.usersService.findMe(user.id)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualiza o perfil do usuário autenticado' })
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(user.id, dto)
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativa a conta do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Conta desativada' })
  deactivateMe(@CurrentUser() user: User) {
    return this.usersService.deactivateMe(user.id)
  }

  @Get('me/pets')
  @ApiOperation({ summary: 'Lista todos os pets do usuário autenticado' })
  getMyPets(@CurrentUser() user: User) {
    return this.usersService.getMyPets(user.id)
  }

  @Get('me/announcements')
  @ApiOperation({ summary: 'Lista todos os anúncios do usuário autenticado' })
  getMyAnnouncements(@CurrentUser() user: User) {
    return this.usersService.getMyAnnouncements(user.id)
  }
}
