import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DeviceStatus, DeviceType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { GenerateBatchDto } from './dto/generate-batch.dto'
import { ActivateDeviceDto } from './dto/activate-device.dto'

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async generateBatch(dto: GenerateBatchDto, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    })
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem gerar lotes')
    }

    const now = new Date()
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const prefix = dto.type === DeviceType.SMART_TAG ? 'CMD-ST' : 'CMD-GPS'
    const batchCode = `${prefix}-${yearMonth}-B${Date.now().toString().slice(-6)}`

    // Descobrir próximo número de sequência global para este tipo
    const lastDevice = await this.prisma.device.findFirst({
      where: { type: dto.type },
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    })
    const startSequence = (lastDevice?.sequenceNumber ?? 0) + 1

    const batch = await this.prisma.deviceBatch.create({
      data: {
        type: dto.type,
        batchCode,
        totalQuantity: dto.quantity,
        generatedBy: adminId,
      },
    })

    const devices: { code: string; type: DeviceType; batchId: string; sequenceNumber: number; securitySuffix: string }[] = []

    for (let i = 0; i < dto.quantity; i++) {
      const seq = startSequence + i
      const suffix = this.randomSuffix(4)
      const code = `${prefix}-${yearMonth}-${String(seq).padStart(6, '0')}-${suffix}`
      devices.push({
        code,
        type: dto.type,
        batchId: batch.id,
        sequenceNumber: seq,
        securitySuffix: suffix,
      })
    }

    // Inserir em blocos de 500 para não sobrecarregar o banco
    const chunkSize = 500
    for (let i = 0; i < devices.length; i += chunkSize) {
      await this.prisma.device.createMany({
        data: devices.slice(i, i + chunkSize),
        skipDuplicates: true,
      })
    }

    return {
      batchId: batch.id,
      batchCode: batch.batchCode,
      type: batch.type,
      totalGenerated: dto.quantity,
      firstCode: devices[0]?.code,
      lastCode: devices[devices.length - 1]?.code,
    }
  }

  async validateCode(code: string) {
    const device = await this.prisma.device.findUnique({
      where: { code },
      select: { code: true, type: true, status: true, petId: true },
    })

    if (!device) throw new NotFoundException('Código não encontrado')

    return {
      code: device.code,
      type: device.type,
      status: device.status,
      canActivate: device.status === DeviceStatus.SOLD && !device.petId,
    }
  }

  async activate(userId: string, dto: ActivateDeviceDto) {
    const device = await this.prisma.device.findUnique({
      where: { code: dto.code },
      select: { id: true, code: true, type: true, status: true, petId: true },
    })

    if (!device) throw new NotFoundException('Dispositivo não encontrado')

    if (device.status === DeviceStatus.ACTIVATED) {
      throw new BadRequestException('Este dispositivo já está ativo')
    }

    if (device.status !== DeviceStatus.SOLD) {
      throw new BadRequestException(
        'Este dispositivo não está disponível para ativação. Verifique o código.',
      )
    }

    const pet = await this.prisma.pet.findUnique({
      where: { id: dto.petId },
      select: { ownerId: true, isActive: true, name: true },
    })

    if (!pet || !pet.isActive) throw new NotFoundException('Pet não encontrado')
    if (pet.ownerId !== userId) {
      throw new ForbiddenException('Este pet não pertence à sua conta')
    }

    if (device.type === DeviceType.GPS_TRACKER && !dto.imei) {
      throw new BadRequestException('IMEI é obrigatório para rastreadores GPS')
    }

    return this.prisma.device.update({
      where: { code: dto.code },
      data: {
        status: DeviceStatus.ACTIVATED,
        petId: dto.petId,
        userId,
        activatedAt: new Date(),
        ...(dto.imei && { imei: dto.imei }),
        ...(dto.simNumber && { simNumber: dto.simNumber }),
      },
      include: {
        pet: { select: { id: true, name: true } },
      },
    })
  }

  async getMyDevice(code: string, userId: string) {
    const device = await this.prisma.device.findUnique({
      where: { code },
      include: {
        pet: { select: { id: true, name: true, species: true } },
        batch: { select: { batchCode: true, type: true } },
      },
    })

    if (!device) throw new NotFoundException('Dispositivo não encontrado')
    if (device.userId !== userId) throw new ForbiddenException('Acesso negado')

    return device
  }

  async getGpsLocation(code: string, userId: string) {
    const device = await this.prisma.device.findUnique({
      where: { code },
      select: {
        userId: true,
        type: true,
        lastLatitude: true,
        lastLongitude: true,
        batteryLevel: true,
        lastSeenAt: true,
        trackingActive: true,
        pet: { select: { id: true, name: true } },
      },
    })

    if (!device) throw new NotFoundException('Dispositivo não encontrado')
    if (device.userId !== userId) throw new ForbiddenException('Acesso negado')
    if (device.type !== DeviceType.GPS_TRACKER) {
      throw new BadRequestException('Este dispositivo não é um rastreador GPS')
    }

    return {
      latitude: device.lastLatitude,
      longitude: device.lastLongitude,
      batteryLevel: device.batteryLevel,
      lastSeenAt: device.lastSeenAt,
      trackingActive: device.trackingActive,
      pet: device.pet,
    }
  }

  async updateGpsLocation(
    code: string,
    latitude: number,
    longitude: number,
    batteryLevel?: number,
  ) {
    return this.prisma.device.update({
      where: { code },
      data: {
        lastLatitude: latitude,
        lastLongitude: longitude,
        ...(batteryLevel !== undefined && { batteryLevel }),
        lastSeenAt: new Date(),
      },
      select: { code: true, lastLatitude: true, lastLongitude: true, lastSeenAt: true },
    })
  }

  async listBatches(adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    })
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso negado')
    }

    return this.prisma.deviceBatch.findMany({
      include: { _count: { select: { devices: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  private randomSuffix(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
  }
}
