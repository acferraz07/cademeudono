import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { User } from '@prisma/client'
import { Request } from 'express'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Public } from '../common/decorators/public.decorator'
import { TagsService } from './tags.service'
import { ActivateTagDto } from './dto/activate-tag.dto'

/**
 * Endpoint público da smart tag — acessível sem login via /pet/:code.
 * Excluído do prefixo global /api no main.ts.
 */
@ApiTags('Smart Tag — Perfil Público')
@Controller('pet')
export class PetPublicController {
  constructor(private readonly tagsService: TagsService) {}

  @Public()
  @Get(':code')
  @ApiOperation({
    summary: 'Página pública do pet (acessada via NFC/QR Code)',
    description:
      'Retorna dados públicos do pet para facilitar a devolução. ' +
      'Não requer autenticação. Registra log de scan automaticamente.',
  })
  @ApiParam({ name: 'code', example: 'CMD-ST-00001' })
  @ApiResponse({ status: 200, description: 'Dados públicos do pet e link de contato' })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  getPublicProfile(@Param('code') code: string, @Req() req: Request) {
    return this.tagsService.getPublicProfile(code, req)
  }
}

/**
 * Endpoints autenticados para gerenciamento de smart tags.
 */
@ApiTags('Smart Tags — Gerenciamento')
@ApiBearerAuth('JWT')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validar código da tag antes de ativar' })
  @ApiParam({ name: 'code', example: 'CMD-ST-00001' })
  validateCode(@Param('code') code: string) {
    return this.tagsService.validateCode(code)
  }

  @Post('activate')
  @ApiOperation({ summary: 'Ativar smart tag e vinculá-la a um pet' })
  @ApiResponse({ status: 201, description: 'Tag ativada com sucesso' })
  @ApiResponse({ status: 400, description: 'Tag já ativa ou não disponível' })
  @ApiResponse({ status: 403, description: 'Pet não pertence ao usuário' })
  activate(@CurrentUser() user: User, @Body() dto: ActivateTagDto) {
    return this.tagsService.activate(user.id, dto)
  }

  @Get('my/:code')
  @ApiOperation({ summary: 'Consultar minha tag (com histórico de scans)' })
  @ApiParam({ name: 'code', example: 'CMD-ST-00001' })
  getMyTag(@CurrentUser() user: User, @Param('code') code: string) {
    return this.tagsService.getMyTag(code, user.id)
  }

  @Patch(':code/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar smart tag' })
  deactivate(@CurrentUser() user: User, @Param('code') code: string) {
    return this.tagsService.deactivate(code, user.id)
  }
}
