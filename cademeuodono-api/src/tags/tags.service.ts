import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { TagStatus } from '@prisma/client'
import { Request } from 'express'
import { PrismaService } from '../prisma/prisma.service'
import { ActivateTagDto } from './dto/activate-tag.dto'

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna os dados públicos do pet vinculado a uma smart tag.
   * Acessível sem autenticação — expõe apenas campos seguros.
   */
  async getPublicProfile(code: string, request: Request) {
    const tag = await this.prisma.smartTag.findUnique({
      where: { code },
      include: {
        pet: {
          include: {
            owner: {
              select: { fullName: true, phonePrimary: true },
            },
            media: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    })

    if (!tag) throw new NotFoundException('Tag não encontrada')

    if (tag.status !== TagStatus.ACTIVE || !tag.pet) {
      return {
        code,
        isActive: false,
        message: 'Esta tag ainda não foi ativada ou não está vinculada a um pet.',
      }
    }

    // Registra scan de forma não bloqueante
    void this.prisma.tagScanLog.create({
      data: {
        tagCode: code,
        ipAddress:
          (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
          request.socket.remoteAddress,
        userAgent: request.headers['user-agent'],
      },
    })

    const { pet } = tag
    const ownerFirstName = pet.owner.fullName.split(' ')[0]
    const whatsappNumber = (pet.owner.phonePrimary ?? '').replace(/\D/g, '')

    return {
      code,
      isActive: true,
      pet: {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        size: pet.size,
        coatColor: pet.coatColor,
        eyeColor: pet.eyeColor,
        specificMarks: pet.specificMarks,
        photo: pet.media[0]?.url ?? pet.profilePhotoUrl ?? null,
      },
      owner: {
        firstName: ownerFirstName,
      },
      contact: {
        whatsappNumber,
        whatsappUrl: this.buildWhatsappUrl(whatsappNumber),
      },
    }
  }

  /** Valida se um código existe e está disponível para ativação */
  async validateCode(code: string) {
    const tag = await this.prisma.smartTag.findUnique({
      where: { code },
      select: { code: true, status: true, petId: true },
    })

    if (!tag) throw new NotFoundException('Código não encontrado')

    return {
      code: tag.code,
      status: tag.status,
      canActivate: tag.status === TagStatus.SOLD && !tag.petId,
    }
  }

  async activate(userId: string, dto: ActivateTagDto) {
    const tag = await this.prisma.smartTag.findUnique({
      where: { code: dto.code },
      select: { code: true, status: true, petId: true },
    })

    if (!tag) throw new NotFoundException('Tag não encontrada')

    if (tag.status === TagStatus.ACTIVE) {
      throw new BadRequestException('Esta tag já está ativa')
    }

    if (tag.status !== TagStatus.SOLD) {
      throw new BadRequestException(
        'Esta tag não está disponível para ativação. Verifique se o código está correto.',
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

    return this.prisma.smartTag.update({
      where: { code: dto.code },
      data: {
        status: TagStatus.ACTIVE,
        petId: dto.petId,
        ownerId: userId,
        activatedAt: new Date(),
      },
      include: {
        pet: { select: { id: true, name: true } },
      },
    })
  }

  async getMyTag(code: string, userId: string) {
    const tag = await this.prisma.smartTag.findUnique({
      where: { code },
      include: {
        pet: { select: { id: true, name: true, species: true } },
        scanLogs: {
          orderBy: { scannedAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!tag) throw new NotFoundException('Tag não encontrada')
    if (tag.ownerId !== userId) throw new ForbiddenException('Acesso negado')

    return tag
  }

  async deactivate(code: string, userId: string) {
    const tag = await this.prisma.smartTag.findUnique({
      where: { code },
      select: { ownerId: true, status: true },
    })

    if (!tag) throw new NotFoundException('Tag não encontrada')
    if (tag.ownerId !== userId) throw new ForbiddenException('Acesso negado')

    return this.prisma.smartTag.update({
      where: { code },
      data: { status: TagStatus.INACTIVE },
    })
  }

  private buildWhatsappUrl(number: string): string {
    const message = encodeURIComponent(
      'Olá! Tudo bem?!\n\n' +
        '⚠️ Sua Smart tag Cadê Meu Dono foi escaneada.\n\n' +
        'Encontrei seu pet! Ele está comigo e em segurança.\n\n' +
        'Podemos combinar a melhor forma para devolvê-lo? 🐾',
    )
    return `https://wa.me/55${number}?text=${message}`
  }
}
