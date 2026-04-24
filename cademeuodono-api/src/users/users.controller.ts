import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
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

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload de foto de perfil (retorna avatarUrl pública)' })
  @ApiResponse({ status: 201, description: 'URL do avatar retornada' })
  uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(user.id, file.buffer, file.mimetype, file.originalname)
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

  @Get('me/activities')
  @ApiOperation({ summary: 'Lista as atividades recentes do usuário autenticado' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  getMyActivities(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 50, 100) : 50
    return this.usersService.getMyActivities(user.id, parsedLimit)
  }
}
