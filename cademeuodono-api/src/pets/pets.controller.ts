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
import { memoryStorage } from 'multer'
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
import { Public } from '../common/decorators/public.decorator'
import { PetsService } from './pets.service'
import { CreatePetDto } from './dto/create-pet.dto'
import { UpdatePetDto } from './dto/update-pet.dto'
import { UpdatePetHealthDto } from './dto/update-pet-health.dto'
import { FilterPetsDto } from './dto/filter-pets.dto'

@ApiTags('Pets')
@ApiBearerAuth('JWT')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload de imagem de pet (retorna URL pública)' })
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
    return this.petsService.uploadImage(user.id, file.buffer, file.mimetype, file.originalname)
  }

  // ─── Endpoints públicos ──────────────────────────────────────────────────────

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Filtrar pets publicamente por espécie, raça e porte' })
  @ApiQuery({ name: 'species', required: false, enum: ['DOG', 'CAT', 'OTHER'] })
  @ApiQuery({ name: 'breedId', required: false, type: String })
  @ApiQuery({ name: 'size', required: false, enum: ['SMALL', 'MEDIUM', 'LARGE', 'GIANT'] })
  findPublic(@Query() filters: FilterPetsDto) {
    return this.petsService.findPublic(filters)
  }

  @Get('public/adoption')
  @Public()
  @ApiOperation({ summary: 'Pets disponíveis para adoção com filtros opcionais' })
  @ApiQuery({ name: 'species', required: false, enum: ['DOG', 'CAT', 'OTHER'] })
  @ApiQuery({ name: 'breedId', required: false, type: String })
  @ApiQuery({ name: 'size', required: false, enum: ['SMALL', 'MEDIUM', 'LARGE', 'GIANT'] })
  findForAdoption(@Query() filters: FilterPetsDto) {
    return this.petsService.findForAdoption(filters)
  }

  @Get('public/adopted')
  @Public()
  @ApiOperation({ summary: 'Esses pets fugiram de casa e seus tutores estão à procura deles' })
  findAdopted() {
    return this.petsService.findAdopted()
  }

  @Get('public/petmatch')
  @Public()
  @ApiOperation({ summary: 'Listar pets disponíveis no PetMatch (público)' })
  findForPetMatch() {
    return this.petsService.findForPetMatch()
  }

  @Get('petmatch/suggestions')
  @ApiOperation({ summary: 'Sugestões de PetMatch com score de compatibilidade' })
  @ApiQuery({ name: 'petId', required: true, type: String })
  petMatchSuggestions(@Query('petId') petId: string) {
    return this.petsService.petMatchSuggestions(petId)
  }

  // ─── Endpoints autenticados ──────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo pet' })
  @ApiResponse({ status: 201, description: 'Pet criado com sucesso' })
  create(@CurrentUser() user: User, @Body() dto: CreatePetDto) {
    return this.petsService.create(user.id, dto)
  }

  @Get()
  @ApiOperation({ summary: 'Listar meus pets' })
  findAll(@CurrentUser() user: User) {
    return this.petsService.findAllByOwner(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pet por ID (somente o tutor)' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.petsService.findOne(id, user.id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do pet' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePetDto,
  ) {
    return this.petsService.update(id, user.id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover pet (soft delete)' })
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.petsService.remove(id, user.id)
  }

  @Patch(':id/mark-adopted')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar pet como adotado' })
  markAdopted(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.petsService.markAdopted(id, user.id)
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Buscar ficha de saúde do pet' })
  getHealth(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.petsService.getHealth(id, user.id)
  }

  @Patch(':id/health')
  @ApiOperation({ summary: 'Criar ou atualizar ficha de saúde do pet' })
  upsertHealth(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePetHealthDto,
  ) {
    return this.petsService.upsertHealth(id, user.id, dto)
  }
}
