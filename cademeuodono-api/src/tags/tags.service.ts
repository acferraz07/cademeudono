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
   * Suporta tanto SmartTag (legado) quanto Device (sistema novo).
   */
  async getPublicProfile(code: string, request: Request) {
    // Tentar SmartTag (sistema legado)
    const tag = await this.prisma.smartTag.findUnique({
      where: { code },
      include: {
        pet: {
          include: {
            owner: {
              select: { fullName: true, phonePrimary: true },
            },
            media: { where: { isPrimary: true }, take: 1 },
            breedRecord: { select: { name: true } },
          },
        },
      },
    })

    // Tentar Device (sistema novo)
    if (!tag) {
      return this.getPublicProfileFromDevice(code, request)
    }

    if (tag.status !== TagStatus.ACTIVE || !tag.pet) {
      return {
        code,
        isActive: false,
        message:
          'Esta tag ainda não foi ativada ou não está vinculada a um pet.',
        tagInfo: {
          text:
            'Cada Smart Tag possui um código único e tecnologia NFC de aproximação. ' +
            'Ao aproximar o celular da tag ou escanear o QR Code, a pessoa acessa instantaneamente ' +
            'a ficha pública do pet, com informações essenciais e um botão para entrar em contato com o tutor.',
        },
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

    return this.buildPublicResponse(code, tag.pet)
  }

  private async getPublicProfileFromDevice(code: string, request: Request) {
    const device = await this.prisma.device.findUnique({
      where: { code },
      include: {
        pet: {
          include: {
            owner: {
              select: { fullName: true, phonePrimary: true },
            },
            media: { where: { isPrimary: true }, take: 1 },
            breedRecord: { select: { name: true } },
          },
        },
      },
    })

    if (!device) throw new NotFoundException('Tag não encontrada')

    if (device.status !== 'ACTIVATED' || !device.pet) {
      return {
        code,
        isActive: false,
        message: 'Esta tag ainda não foi ativada ou não está vinculada a um pet.',
      }
    }

    return this.buildPublicResponse(code, device.pet)
  }

  private buildPublicResponse(
    code: string,
    pet: {
      name: string
      species: string
      breed: string | null
      breedName: string | null
      breedRecord: { name: string } | null
      size: string | null
      coatColor: string[]
      eyeColor: string | null
      specificMarks: string | null
      profilePhotoUrl: string | null
      media: { url: string }[]
      owner: { fullName: string; phonePrimary: string | null }
    },
  ) {
    const ownerFirstName = pet.owner.fullName.split(' ')[0]
    const phoneNumber = (pet.owner.phonePrimary ?? '').replace(/\D/g, '')
    const breedDisplay = pet.breedRecord?.name ?? pet.breedName ?? pet.breed ?? null

    const contactUrl = this.buildContactUrl(phoneNumber, pet.name, code)

    return {
      code,
      isActive: true,
      // Dados para o frontend construir URL com localização
      petName: pet.name,
      tagCode: code,
      phoneNumber,
      pet: {
        name: pet.name,
        species: pet.species,
        breed: breedDisplay,
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
        phoneNumber,
        // URL de fallback sem localização — o frontend pode construir uma URL com localização
        contactUrl,
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
      canActivate: tag.status === TagStatus.AVAILABLE && !tag.petId,
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

    if (tag.status !== TagStatus.AVAILABLE) {
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

    const activated = await this.prisma.smartTag.update({
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

    void this.prisma.activityLog.create({
      data: { userId, type: 'TAG_ACTIVATED', description: `CMD Smart Tag ativada: ${dto.code}`, entityType: 'smartTag', entityId: dto.code },
    }).catch(() => {})

    return activated
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

  private buildContactUrl(number: string, petName: string, tagCode: string): string {
    const message = encodeURIComponent(
      `Olá! Encontrei o pet ${petName} através da Smart Tag Cadê Meu Dono.\n\n` +
        `A tag escaneada foi: ${tagCode}\n\n` +
        `Podemos combinar a melhor forma para devolvê-lo? 🐾`,
    )
    return `https://wa.me/55${number}?text=${message}`
  }
}
