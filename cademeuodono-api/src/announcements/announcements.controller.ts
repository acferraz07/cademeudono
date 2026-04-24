import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  FileTypeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { User } from '@prisma/client'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AnnouncementsService } from './announcements.service'
import { CreateAnnouncementDto } from './dto/create-announcement.dto'
import { UpdateAnnouncementDto } from './dto/update-announcement.dto'
import { FilterAnnouncementsDto } from './dto/filter-announcements.dto'
import { UpdateStatusDto } from './dto/update-status.dto'

@ApiTags('Anúncios')
@ApiBearerAuth('JWT')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload de imagem de anúncio (retorna URL pública)' })
  @ApiResponse({ status: 201, description: 'URL da imagem retornada' })
  uploadImage(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.announcementsService.uploadImage(user.id, file.buffer, file.mimetype, file.originalname)
  }

  @Post()
  @ApiOperation({ summary: 'Publicar anúncio de pet perdido ou encontrado' })
  @ApiResponse({ status: 201, description: 'Anúncio criado com sucesso' })
  create(@CurrentUser() user: User, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(user.id, dto)
  }

  @Get()
  @ApiOperation({ summary: 'Listar anúncios com filtros' })
  @ApiQuery({ type: FilterAnnouncementsDto })
  findAll(@Query() filters: FilterAnnouncementsDto) {
    return this.announcementsService.findAll(filters)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar anúncio por ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.announcementsService.findOne(id, user?.id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar anúncio (somente o autor)' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, user.id, dto)
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar status do anúncio (perdido → encontrado → devolvido)' })
  updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.announcementsService.updateStatus(id, user.id, dto.status)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arquivar anúncio (soft delete)' })
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.announcementsService.remove(id, user.id)
  }

  @Get(':id/matches')
  @ApiOperation({ summary: 'Buscar anúncios com potencial de match (perdido ↔ encontrado)' })
  findMatches(@Param('id', ParseUUIDPipe) id: string) {
    return this.announcementsService.findPotentialMatches(id)
  }
}
