import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseService } from '../supabase/supabase.service'
import { CreatePetDto } from './dto/create-pet.dto'
import { UpdatePetDto } from './dto/update-pet.dto'
import { UpdatePetHealthDto } from './dto/update-pet-health.dto'
import { FilterPetsDto } from './dto/filter-pets.dto'

@Injectable()
export class PetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async create(ownerId: string, dto: CreatePetDto) {
    const {
      vetName, vetPhone, vetClinic, petShop,
      vaccinationStatus, dewormingStatus,
      continuousMedications, allergies, specialCare,
      breedId,
      ...petData
    } = dto

    // Buscar nome da raça se breedId fornecido
    let breedName = petData.breedName
    if (breedId && !breedName) {
      const breedRecord = await this.prisma.breed.findUnique({
        where: { id: breedId },
        select: { name: true },
      })
      if (breedRecord) breedName = breedRecord.name
    }

    const hasHealthFields = [
      vetName, vetPhone, vetClinic, petShop,
      vaccinationStatus, dewormingStatus,
      continuousMedications, allergies, specialCare,
    ].some((v) => v !== undefined)

    return this.prisma.pet.create({
      data: {
        ...petData,
        breedId: breedId ?? undefined,
        breedName: breedName ?? undefined,
        birthDate: petData.birthDate ? new Date(petData.birthDate) : undefined,
        coatColor: petData.coatColor ?? [],
        ownerId,
        ...(hasHealthFields
          ? {
              health: {
                create: {
                  vetName,
                  vetPhone,
                  vetClinic,
                  petShop,
                  vaccinationStatus,
                  dewormingStatus,
                  continuousMedications,
                  allergies,
                  specialCare,
                  preexistingConditions: [],
                },
              },
            }
          : {}),
      },
      include: { health: true, breedRecord: { select: { id: true, name: true, species: true } } },
    })
  }

  async findAllByOwner(ownerId: string) {
    return this.prisma.pet.findMany({
      where: { ownerId, isActive: true },
      include: {
        health: true,
        media: { where: { isPrimary: true }, take: 1 },
        smartTags: { where: { status: 'ACTIVE' } },
        breedRecord: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string, requesterId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
      include: {
        health: true,
        media: true,
        smartTags: true,
        breedRecord: { select: { id: true, name: true, species: true, size: true } },
        owner: {
          select: {
            id: true,
            fullName: true,
            phonePrimary: true,
            whatsapp: true,
            city: true,
            state: true,
          },
        },
      },
    })

    if (!pet || !pet.isActive) throw new NotFoundException('Pet não encontrado')
    if (pet.ownerId !== requesterId) throw new ForbiddenException('Acesso negado')

    return pet
  }

  async update(id: string, requesterId: string, dto: UpdatePetDto) {
    await this.assertOwner(id, requesterId)
    const {
      vetName, vetPhone, vetClinic, petShop,
      vaccinationStatus, dewormingStatus,
      continuousMedications, allergies, specialCare,
      breedId,
      ...petData
    } = dto

    let breedName = petData.breedName
    if (breedId && !breedName) {
      const breedRecord = await this.prisma.breed.findUnique({
        where: { id: breedId },
        select: { name: true },
      })
      if (breedRecord) breedName = breedRecord.name
    }

    const hasHealthFields = [
      vetName, vetPhone, vetClinic, petShop,
      vaccinationStatus, dewormingStatus,
      continuousMedications, allergies, specialCare,
    ].some((v) => v !== undefined)

    if (hasHealthFields) {
      await this.prisma.petHealth.upsert({
        where: { petId: id },
        create: {
          petId: id,
          vetName, vetPhone, vetClinic, petShop,
          vaccinationStatus, dewormingStatus,
          continuousMedications, allergies, specialCare,
          preexistingConditions: [],
        },
        update: {
          vetName, vetPhone, vetClinic, petShop,
          vaccinationStatus, dewormingStatus,
          continuousMedications, allergies, specialCare,
        },
      })
    }

    return this.prisma.pet.update({
      where: { id },
      data: {
        ...petData,
        ...(breedId !== undefined && { breedId }),
        ...(breedName && { breedName }),
        birthDate: petData.birthDate ? new Date(petData.birthDate) : undefined,
      },
      include: { health: true, breedRecord: { select: { id: true, name: true } } },
    })
  }

  async remove(id: string, requesterId: string) {
    await this.assertOwner(id, requesterId)

    await this.prisma.pet.update({
      where: { id },
      data: { isActive: false },
    })

    return { message: 'Pet removido com sucesso' }
  }

  async upsertHealth(petId: string, requesterId: string, dto: UpdatePetHealthDto) {
    await this.assertOwner(petId, requesterId)

    const data = {
      ...dto,
      lastVaccinationDate: dto.lastVaccinationDate
        ? new Date(dto.lastVaccinationDate)
        : undefined,
      lastDewormingDate: dto.lastDewormingDate
        ? new Date(dto.lastDewormingDate)
        : undefined,
      preexistingConditions: dto.preexistingConditions ?? [],
    }

    return this.prisma.petHealth.upsert({
      where: { petId },
      create: { petId, ...data },
      update: data,
    })
  }

  async getHealth(petId: string, requesterId: string) {
    await this.assertOwner(petId, requesterId)

    const health = await this.prisma.petHealth.findUnique({
      where: { petId },
    })

    if (!health) throw new NotFoundException('Ficha de saúde não encontrada')
    return health
  }

  async uploadImage(
    ownerId: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ): Promise<{ url: string }> {
    const ext = originalname.split('.').pop() ?? 'jpg'
    const path = `${ownerId}/${randomUUID()}.${ext}`
    const url = await this.supabase.uploadFile('pets', path, buffer, mimetype)
    return { url }
  }

  // ─── Listagens públicas ──────────────────────────────────────────────────────

  async findForAdoption(filters?: FilterPetsDto) {
    return this.prisma.pet.findMany({
      where: {
        isForAdoption: true,
        isAdopted: false,
        isActive: true,
        ...(filters?.species && { species: filters.species }),
        ...(filters?.breedId && { breedId: filters.breedId }),
        ...(filters?.size && { size: filters.size }),
      },
      include: {
        media: { where: { isPrimary: true }, take: 1 },
        breedRecord: { select: { name: true } },
        owner: { select: { id: true, fullName: true, phonePrimary: true, whatsapp: true, city: true, state: true } },
      },
      orderBy: [{ adoptionUrgency: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async findAdopted() {
    return this.prisma.pet.findMany({
      where: { isAdopted: true, isActive: true },
      include: {
        media: { where: { isPrimary: true }, take: 1 },
        breedRecord: { select: { name: true } },
        owner: { select: { id: true, fullName: true, city: true, state: true } },
      },
      orderBy: { adoptedAt: 'desc' },
    })
  }

  async findForPetMatch() {
    return this.prisma.pet.findMany({
      where: { isForPetMatch: true, isActive: true },
      include: {
        media: { where: { isPrimary: true }, take: 1 },
        breedRecord: { select: { name: true } },
        owner: { select: { id: true, fullName: true, phonePrimary: true, whatsapp: true, city: true, state: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /** Filtro público: GET /pets/public?species=DOG&breedId=...&size=MEDIUM */
  async findPublic(filters: FilterPetsDto) {
    return this.prisma.pet.findMany({
      where: {
        isActive: true,
        ...(filters.species && { species: filters.species }),
        ...(filters.breedId && { breedId: filters.breedId }),
        ...(filters.size && { size: filters.size }),
      },
      include: {
        media: { where: { isPrimary: true }, take: 1 },
        breedRecord: { select: { id: true, name: true } },
        owner: { select: { id: true, fullName: true, city: true, state: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  /** PetMatch: sugestões de pets compatíveis com score */
  async petMatchSuggestions(petId: string) {
    const sourcePet = await this.prisma.pet.findUnique({
      where: { id: petId, isActive: true },
      include: {
        owner: { select: { city: true, state: true } },
      },
    })

    if (!sourcePet) throw new NotFoundException('Pet não encontrado')

    const candidates = await this.prisma.pet.findMany({
      where: {
        isForPetMatch: true,
        isActive: true,
        species: sourcePet.species,
        id: { not: petId },
      },
      include: {
        media: { where: { isPrimary: true }, take: 1 },
        breedRecord: { select: { name: true } },
        owner: { select: { id: true, fullName: true, phonePrimary: true, whatsapp: true, city: true, state: true } },
      },
    })

    const scored = candidates.map((candidate) => {
      let score = 0

      if (sourcePet.breedId && candidate.breedId === sourcePet.breedId) score += 10
      if (sourcePet.size && candidate.size === sourcePet.size) score += 5
      if (
        sourcePet.owner.city &&
        candidate.owner.city?.toLowerCase() === sourcePet.owner.city.toLowerCase()
      ) {
        score += 3
      }

      return { ...candidate, matchScore: score }
    })

    return scored.sort((a, b) => b.matchScore - a.matchScore)
  }

  async markAdopted(id: string, requesterId: string) {
    await this.assertOwner(id, requesterId)
    return this.prisma.pet.update({
      where: { id },
      data: { isAdopted: true, isForAdoption: false, adoptedAt: new Date() },
    })
  }

  private async assertOwner(petId: string, userId: string): Promise<void> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      select: { ownerId: true, isActive: true },
    })

    if (!pet || !pet.isActive) throw new NotFoundException('Pet não encontrado')
    if (pet.ownerId !== userId) throw new ForbiddenException('Acesso negado')
  }
}
