import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseService } from '../supabase/supabase.service'
import { UpdateUserDto } from './dto/update-user.dto'

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR_SIZE = 5 * 1024 * 1024

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { pets: true, announcements: true },
        },
      },
    })

    if (!user) throw new NotFoundException('Usuário não encontrado')
    return user
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    })

    void this.logActivity(userId, 'PROFILE_UPDATE', 'Perfil atualizado')

    return user
  }

  async uploadAvatar(userId: string, buffer: Buffer, mimetype: string, originalname: string) {
    if (!ALLOWED_MIMETYPES.includes(mimetype)) {
      throw new BadRequestException('Formato inválido. Aceito: jpg, png, webp')
    }
    if (buffer.length > MAX_AVATAR_SIZE) {
      throw new BadRequestException('Imagem muito grande. Limite: 5 MB')
    }

    const ext = originalname.split('.').pop() ?? 'jpg'
    const path = `avatars/${userId}/${randomUUID()}.${ext}`
    const avatarUrl = await this.supabase.uploadFile('users', path, buffer, mimetype)

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    })

    void this.logActivity(userId, 'AVATAR_UPLOAD', 'Foto de perfil atualizada')

    return { avatarUrl: user.avatarUrl }
  }

  async deactivateMe(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })

    return { message: 'Conta desativada com sucesso' }
  }

  async getMyPets(userId: string) {
    return this.prisma.pet.findMany({
      where: { ownerId: userId, isActive: true },
      include: {
        health: true,
        media: { where: { isPrimary: true }, take: 1 },
        smartTags: { where: { status: 'ACTIVE' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getMyAnnouncements(userId: string) {
    return this.prisma.announcement.findMany({
      where: { ownerId: userId },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getMyActivities(userId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async logActivity(
    userId: string,
    type: string,
    description: string,
    entityType?: string,
    entityId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    try {
      await this.prisma.activityLog.create({
        data: { userId, type, description, entityType, entityId, metadata },
      })
    } catch {
      // log de atividade é não-crítico — nunca deixa o fluxo principal falhar
    }
  }
}
