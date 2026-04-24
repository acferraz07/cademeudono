import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'crypto'
import { extname } from 'path'
import { AnnouncementStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateAnnouncementDto } from './dto/create-announcement.dto'
import { UpdateAnnouncementDto } from './dto/update-announcement.dto'
import { FilterAnnouncementsDto } from './dto/filter-announcements.dto'

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async uploadImage(ownerId: string, buffer: Buffer, mimetype: string, originalname: string) {
    const ext = extname(originalname) || '.jpg'
    const path = `announcements/${ownerId}/${randomUUID()}${ext}`
    const url = await this.supabase.uploadFile('pet-images', path, buffer, mimetype)
    return { url }
  }

  async create(ownerId: string, dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        ...dto,
        eventDate: new Date(dto.eventDate),
        coatColor: dto.coatColor ?? [],
        ownerId,
      },
      include: {
        images: true,
        owner: { select: { id: true, fullName: true } },
      },
    })

    const typeLabel = dto.type === 'LOST' ? 'perdido' : 'encontrado'
    void this.prisma.activityLog.create({
      data: { userId: ownerId, type: `ANNOUNCEMENT_${dto.type}`, description: `Anúncio de pet ${typeLabel} cadastrado`, entityType: 'announcement', entityId: announcement.id },
    }).catch(() => {})

    return announcement
  }

  async findAll(filters: FilterAnnouncementsDto) {
    const {
      type,
      status = AnnouncementStatus.ACTIVE,
      species,
      size,
      state,
      city,
      neighborhood,
      page = 1,
      limit = 20,
    } = filters

    const where: Prisma.AnnouncementWhereInput = { status }

    if (type) where.type = type
    if (species) where.species = species
    if (size) where.size = size
    if (state) where.state = state
    if (city) where.city = { equals: city, mode: 'insensitive' }
    if (neighborhood) {
      where.neighborhood = { contains: neighborhood, mode: 'insensitive' }
    }

    const [total, items] = await Promise.all([
      this.prisma.announcement.count({ where }),
      this.prisma.announcement.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          owner: { select: { id: true, fullName: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        images: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            phonePrimary: true,
            city: true,
            state: true,
          },
        },
      },
    })

    if (!announcement) throw new NotFoundException('Anúncio não encontrado')

    // Incrementa visualizações de forma não bloqueante
    void this.prisma.announcement.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    })

    return announcement
  }

  async update(id: string, requesterId: string, dto: UpdateAnnouncementDto) {
    await this.assertOwner(id, requesterId)

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...dto,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      },
      include: { images: true },
    })
  }

  async updateStatus(id: string, requesterId: string, status: AnnouncementStatus) {
    await this.assertOwner(id, requesterId)

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: { status },
    })

    void this.prisma.activityLog.create({
      data: { userId: requesterId, type: 'ANNOUNCEMENT_STATUS', description: `Status do anúncio alterado para ${status}`, entityType: 'announcement', entityId: id },
    }).catch(() => {})

    return announcement
  }

  async remove(id: string, requesterId: string) {
    await this.assertOwner(id, requesterId)

    await this.prisma.announcement.update({
      where: { id },
      data: { status: AnnouncementStatus.ARCHIVED },
    })

    return { message: 'Anúncio arquivado com sucesso' }
  }

  async findPotentialMatches(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      select: {
        type: true,
        species: true,
        size: true,
        city: true,
        state: true,
      },
    })

    if (!announcement) throw new NotFoundException('Anúncio não encontrado')

    const oppositeType = announcement.type === 'LOST' ? 'FOUND' : 'LOST'

    return this.prisma.announcement.findMany({
      where: {
        type: oppositeType,
        status: AnnouncementStatus.ACTIVE,
        species: announcement.species,
        city: { equals: announcement.city, mode: 'insensitive' },
        state: announcement.state,
        ...(announcement.size ? { size: announcement.size } : {}),
        id: { not: id },
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        owner: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  }

  private async assertOwner(announcementId: string, userId: string): Promise<void> {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
      select: { ownerId: true },
    })

    if (!announcement) throw new NotFoundException('Anúncio não encontrado')
    if (announcement.ownerId !== userId) throw new ForbiddenException('Acesso negado')
  }
}
