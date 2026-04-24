import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { User } from '@prisma/client'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Public } from '../common/decorators/public.decorator'
import { OrgProtectorsService } from './org-protectors.service'
import { CreateOrgProtectorDto } from './dto/create-org-protector.dto'

@ApiTags('ONGs e Protetores')
@ApiBearerAuth('JWT')
@Controller('org-protectors')
export class OrgProtectorsController {
  constructor(private readonly service: OrgProtectorsService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar ONG ou Protetor' })
  create(@CurrentUser() user: User, @Body() dto: CreateOrgProtectorDto) {
    return this.service.create(user.id, dto)
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar ONGs e Protetores aprovados (público)' })
  findAll(
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('type') type?: string,
  ) {
    return this.service.findAll({ state, city, type })
  }

  @Get('me')
  @ApiOperation({ summary: 'Meu cadastro de ONG/Protetor' })
  findMine(@CurrentUser() user: User) {
    return this.service.findMine(user.id)
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Buscar ONG/Protetor por ID (público)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar meu cadastro de ONG/Protetor' })
  update(@CurrentUser() user: User, @Body() dto: Partial<CreateOrgProtectorDto>) {
    return this.service.update(user.id, dto as CreateOrgProtectorDto)
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar meu cadastro de ONG/Protetor' })
  deactivate(@CurrentUser() user: User) {
    return this.service.deactivate(user.id)
  }
}
