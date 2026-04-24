import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { User } from '@prisma/client'
import { Request } from 'express'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AdoptionService } from './adoption.service'
import { CreateAdoptionDto } from './dto/create-adoption.dto'

@ApiTags('Adoção')
@ApiBearerAuth('JWT')
@Controller('adoptions')
export class AdoptionController {
  constructor(private readonly adoptionService: AdoptionService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar adoção com termo jurídico e gerar PDF' })
  @ApiResponse({ status: 201, description: 'Adoção registrada e PDF em geração' })
  @ApiResponse({ status: 400, description: 'Termo não aceito ou CPF inválido' })
  create(@CurrentUser() user: User, @Body() dto: CreateAdoptionDto, @Req() req: Request) {
    return this.adoptionService.create(user.id, dto, req)
  }

  @Get('my')
  @ApiOperation({ summary: 'Listar minhas adoções com histórico e PDF' })
  findMy(@CurrentUser() user: User) {
    return this.adoptionService.findMyAdoptions(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma adoção (inclui link do PDF)' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.adoptionService.findOne(id, user.id)
  }
}
