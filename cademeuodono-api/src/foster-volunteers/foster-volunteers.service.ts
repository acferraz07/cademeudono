import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFosterVolunteerDto } from './dto/create-foster-volunteer.dto'

@Injectable()
export class FosterVolunteersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, dto: CreateFosterVolunteerDto) {
    const existing = await this.prisma.fosterVolunteer.findUnique({
      where: { userId },
    })

    if (existing) {
      return this.prisma.fosterVolunteer.update({
        where: { userId },
        data: { ...dto, isActive: true },
      })
    }

    return this.prisma.fosterVolunteer.create({
      data: { ...dto, userId },
    })
  }

  async findMine(userId: string) {
    const volunteer = await this.prisma.fosterVolunteer.findUnique({
      where: { userId },
    })
    if (!volunteer) throw new NotFoundException('Cadastro não encontrado')
    return volunteer
  }

  async deactivate(userId: string) {
    await this.prisma.fosterVolunteer.update({
      where: { userId },
      data: { isActive: false },
    })
    return { message: 'Cadastro desativado' }
  }
}
