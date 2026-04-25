import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'crypto'
import { AnnouncementStatus, AnnouncementType } from '@prisma/client'
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

    const pet = await this.prisma.pet.create({
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

    void this.prisma.activityLog.create({
      data: { userId: ownerId, type: 'PET_CREATE', description: `Cadastrou o pet ${pet.name}`, entityType: 'pet', entityId: pet.id },
    }).catch(() => {})

    // Auto-anúncio ao criar com status
    if (pet.isLost) void this.upsertAnnouncement(pet.id, ownerId, 'LOST').catch(() => {})
    if (pet.isFound) void this.upsertAnnouncement(pet.id, ownerId, 'FOUND').catch(() => {})

    return pet
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
    const existingPet = await this.assertOwner(id, requesterId)

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

    const updated = await this.prisma.pet.update({
      where: { id },
      data: {
        ...petData,
        ...(breedId !== undefined && { breedId }),
        ...(breedName && { breedName }),
        birthDate: petData.birthDate ? new Date(petData.birthDate) : undefined,
        // isUrgentFoster só pode estar ativo em estados válidos
        ...this.resolveUrgentFoster(petData),
      },
      include: { health: true, breedRecord: { select: { id: true, name: true } } },
    })

    // Registra atividade com mensagem amigável
    const activityDesc = this.buildUpdateActivityDesc(updated.name, existingPet, updated)
    void this.prisma.activityLog.create({
      data: { userId: requesterId, type: 'PET_UPDATE', description: activityDesc, entityType: 'pet', entityId: id },
    }).catch(() => {})

    // Gerencia anúncios automáticos por mudança de status
    void this.syncAnnouncementsFromStatus(id, requesterId, existingPet, updated).catch(() => {})

    return updated
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

    void this.prisma.activityLog.create({
      data: { userId: ownerId, type: 'PET_PHOTO_UPLOAD', description: 'Foto de pet enviada' },
    }).catch(() => {})

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
        owner: { select: { id: true, fullName: true, phonePrimary: true, city: true, state: true } },
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
        owner: { select: { id: true, fullName: true, phonePrimary: true, city: true, state: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

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
        owner: { select: { id: true, fullName: true, phonePrimary: true, city: true, state: true } },
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
    const pet = await this.prisma.pet.update({
      where: { id },
      data: { isAdopted: true, isForAdoption: false, adoptedAt: new Date() },
    })

    void this.prisma.activityLog.create({
      data: { userId: requesterId, type: 'PET_ADOPTED', description: `Adoção do pet ${pet.name} foi realizada`, entityType: 'pet', entityId: id },
    }).catch(() => {})

    return pet
  }

  // ─── Helpers privados ────────────────────────────────────────────────────────

  private resolveUrgentFoster(petData: Partial<UpdatePetDto>) {
    // isUrgentFoster só faz sentido quando pet foi encontrado ou está em adoção
    if (petData.isUrgentFoster === true) {
      const validForUrgent = petData.isFound === true || petData.isForAdoption === true
      if (!validForUrgent) {
        return { isUrgentFoster: false }
      }
    }
    return {}
  }

  private buildUpdateActivityDesc(
    petName: string,
    before: { isLost: boolean; isFound: boolean; isReturned: boolean; isForAdoption: boolean; isAdopted: boolean },
    after: { isLost: boolean; isFound: boolean; isReturned: boolean; isForAdoption: boolean; isAdopted: boolean },
  ): string {
    if (!before.isLost && after.isLost) return `Anunciou o pet ${petName} como perdido`
    if (before.isLost && !after.isLost) return `Removeu o pet ${petName} da lista de perdidos`
    if (!before.isFound && after.isFound) return `Anunciou o pet ${petName} como encontrado (procura-se tutor)`
    if (!before.isReturned && after.isReturned) return `O pet ${petName} foi devolvido ao tutor`
    if (!before.isForAdoption && after.isForAdoption) return `Disponibilizou o pet ${petName} para adoção`
    if (before.isForAdoption && !after.isForAdoption) return `Removeu o pet ${petName} da adoção`
    if (!before.isAdopted && after.isAdopted) return `A adoção do pet ${petName} foi realizada`
    return `Atualizou a ficha do pet ${petName}`
  }

  private async syncAnnouncementsFromStatus(
    petId: string,
    ownerId: string,
    before: { isLost: boolean; isFound: boolean; isReturned: boolean },
    after: { isLost: boolean; isFound: boolean; isReturned: boolean },
  ) {
    // Tornou-se perdido → cria/atualiza anúncio LOST
    if (!before.isLost && after.isLost) {
      await this.upsertAnnouncement(petId, ownerId, 'LOST')
      void this.prisma.activityLog.create({
        data: { userId: ownerId, type: 'ANNOUNCEMENT_LOST', description: `Anúncio de pet perdido criado automaticamente`, entityType: 'pet', entityId: petId },
      }).catch(() => {})
    }

    // Deixou de ser perdido → arquiva anúncio LOST
    if (before.isLost && !after.isLost) {
      await this.archiveAnnouncementByPetAndType(petId, 'LOST')
    }

    // Tornou-se encontrado → cria/atualiza anúncio FOUND
    if (!before.isFound && after.isFound) {
      await this.upsertAnnouncement(petId, ownerId, 'FOUND')
      void this.prisma.activityLog.create({
        data: { userId: ownerId, type: 'ANNOUNCEMENT_FOUND', description: `Anúncio de pet encontrado criado automaticamente`, entityType: 'pet', entityId: petId },
      }).catch(() => {})
    }

    // Deixou de ser encontrado → arquiva anúncio FOUND
    if (before.isFound && !after.isFound) {
      await this.archiveAnnouncementByPetAndType(petId, 'FOUND')
    }

    // Devolvido → marca anúncios LOST e FOUND como RETURNED_TO_OWNER
    if (!before.isReturned && after.isReturned) {
      await this.prisma.announcement.updateMany({
        where: { petId, status: AnnouncementStatus.ACTIVE },
        data: { status: AnnouncementStatus.RETURNED_TO_OWNER },
      })
      void this.prisma.activityLog.create({
        data: { userId: ownerId, type: 'PET_RETURNED', description: `Pet devolvido ao tutor`, entityType: 'pet', entityId: petId },
      }).catch(() => {})
    }
  }

  private async upsertAnnouncement(petId: string, ownerId: string, type: AnnouncementType) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: { owner: { select: { state: true, city: true, neighborhood: true, block: true, phonePrimary: true, fullName: true } } },
    })
    if (!pet) return

    const contact = pet.owner.phonePrimary ?? ''
    const breedLabel = pet.breedName ?? pet.breed ?? undefined

    // Verifica se já existe anúncio ativo deste tipo para este pet
    const existing = await this.prisma.announcement.findFirst({
      where: { petId, type, status: { not: AnnouncementStatus.ARCHIVED } },
    })

    if (existing) {
      // Atualiza dados do pet no anúncio existente
      await this.prisma.announcement.update({
        where: { id: existing.id },
        data: {
          status: AnnouncementStatus.ACTIVE,
          petName: pet.name,
          species: pet.species,
          breed: breedLabel,
          size: pet.size ?? undefined,
          coatColor: pet.coatColor,
          eyeColor: pet.eyeColor ?? undefined,
          specificMarks: pet.specificMarks ?? undefined,
          petPhotoUrl: pet.profilePhotoUrl ?? undefined,
          contactPhone: contact,
          contactName: pet.owner.fullName,
        },
      })
    } else {
      await this.prisma.announcement.create({
        data: {
          ownerId,
          petId,
          type,
          status: AnnouncementStatus.ACTIVE,
          petName: pet.name,
          species: pet.species,
          breed: breedLabel,
          size: pet.size ?? undefined,
          coatColor: pet.coatColor,
          eyeColor: pet.eyeColor ?? undefined,
          specificMarks: pet.specificMarks ?? undefined,
          petPhotoUrl: pet.profilePhotoUrl ?? undefined,
          state: pet.owner.state ?? 'TO',
          city: pet.owner.city ?? '',
          neighborhood: pet.owner.neighborhood ?? undefined,
          block: pet.owner.block ?? undefined,
          eventDate: new Date(),
          contactPhone: contact,
          contactName: pet.owner.fullName,
        },
      })
    }
  }

  private async archiveAnnouncementByPetAndType(petId: string, type: AnnouncementType) {
    await this.prisma.announcement.updateMany({
      where: { petId, type, status: AnnouncementStatus.ACTIVE },
      data: { status: AnnouncementStatus.ARCHIVED },
    })
  }

  private async assertOwner(petId: string, userId: string): Promise<{ isLost: boolean; isFound: boolean; isReturned: boolean; isForAdoption: boolean; isAdopted: boolean }> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      select: { ownerId: true, isActive: true, isLost: true, isFound: true, isReturned: true, isForAdoption: true, isAdopted: true },
    })

    if (!pet || !pet.isActive) throw new NotFoundException('Pet não encontrado')
    if (pet.ownerId !== userId) throw new ForbiddenException('Acesso negado')

    return { isLost: pet.isLost, isFound: pet.isFound, isReturned: pet.isReturned, isForAdoption: pet.isForAdoption, isAdopted: pet.isAdopted }
  }
}
