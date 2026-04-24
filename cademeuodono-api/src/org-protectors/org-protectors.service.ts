import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrgProtectorDto } from './dto/create-org-protector.dto'
import { PartialType } from '@nestjs/swagger'

class UpdateOrgProtectorDto extends PartialType(CreateOrgProtectorDto) {}

@Injectable()
export class OrgProtectorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrgProtectorDto) {
    const existing = await this.prisma.orgProtector.findUnique({ where: { userId } })
    if (existing) throw new ConflictException('Você já tem um cadastro de ONG/Protetor')

    return this.prisma.orgProtector.create({
      data: {
        ...dto,
        userId,
        actingSpecies: dto.actingSpecies ?? [],
        actingCities: dto.actingCities ?? [],
      },
    })
  }

  async findAll(params?: { state?: string; city?: string; type?: string }) {
    return this.prisma.orgProtector.findMany({
      where: {
        isActive: true,
        isApproved: true,
        ...(params?.state && { state: params.state }),
        ...(params?.city && { city: { contains: params.city, mode: 'insensitive' } }),
        ...(params?.type && { type: params.type }),
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const org = await this.prisma.orgProtector.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    })
    if (!org || !org.isActive) throw new NotFoundException('ONG/Protetor não encontrado')
    return org
  }

  async findMine(userId: string) {
    const org = await this.prisma.orgProtector.findUnique({
      where: { userId },
    })
    if (!org) throw new NotFoundException('Cadastro não encontrado')
    return org
  }

  async update(userId: string, dto: UpdateOrgProtectorDto) {
    const org = await this.prisma.orgProtector.findUnique({ where: { userId } })
    if (!org) throw new NotFoundException('Cadastro não encontrado')

    return this.prisma.orgProtector.update({
      where: { userId },
      data: dto,
    })
  }

  async deactivate(userId: string) {
    const org = await this.prisma.orgProtector.findUnique({ where: { userId } })
    if (!org) throw new NotFoundException('Cadastro não encontrado')

    await this.prisma.orgProtector.update({
      where: { userId },
      data: { isActive: false },
    })

    return { message: 'Cadastro desativado com sucesso' }
  }
}
