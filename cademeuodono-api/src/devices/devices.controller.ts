import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { User } from '@prisma/client'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { DevicesService } from './devices.service'
import { GenerateBatchDto } from './dto/generate-batch.dto'
import { ActivateDeviceDto } from './dto/activate-device.dto'

@ApiTags('Dispositivos (Smart Tag / GPS)')
@ApiBearerAuth('JWT')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('batch/generate')
  @ApiOperation({ summary: 'Gerar lote de dispositivos (apenas ADMIN)' })
  @ApiResponse({ status: 201, description: 'Lote gerado com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  generateBatch(@CurrentUser() user: User, @Body() dto: GenerateBatchDto) {
    return this.devicesService.generateBatch(dto, user.id)
  }

  @Get('batches')
  @ApiOperation({ summary: 'Listar lotes gerados (apenas ADMIN)' })
  listBatches(@CurrentUser() user: User) {
    return this.devicesService.listBatches(user.id)
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validar código do dispositivo antes de ativar' })
  @ApiParam({ name: 'code', example: 'CMD-ST-202604-000001-AB12' })
  validateCode(@Param('code') code: string) {
    return this.devicesService.validateCode(code)
  }

  @Post('activate')
  @ApiOperation({ summary: 'Ativar dispositivo e vincular a um pet' })
  @ApiResponse({ status: 201, description: 'Dispositivo ativado com sucesso' })
  activate(@CurrentUser() user: User, @Body() dto: ActivateDeviceDto) {
    return this.devicesService.activate(user.id, dto)
  }

  @Get('my/:code')
  @ApiOperation({ summary: 'Consultar meu dispositivo' })
  @ApiParam({ name: 'code', example: 'CMD-ST-202604-000001-AB12' })
  getMyDevice(@CurrentUser() user: User, @Param('code') code: string) {
    return this.devicesService.getMyDevice(code, user.id)
  }

  @Get('gps/:code/location')
  @ApiOperation({ summary: 'Obter localização atual do GPS (autenticado)' })
  @ApiParam({ name: 'code', example: 'CMD-GPS-202604-000001-Z9P4' })
  getGpsLocation(@CurrentUser() user: User, @Param('code') code: string) {
    return this.devicesService.getGpsLocation(code, user.id)
  }
}
