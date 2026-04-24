import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    })
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
}
