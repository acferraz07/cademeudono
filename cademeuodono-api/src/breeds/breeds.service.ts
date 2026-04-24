import { Injectable } from '@nestjs/common'
import { Species } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BreedsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(species?: string) {
    const where: { isActive: boolean; species?: Species } = { isActive: true }

    if (species) {
      const speciesMap: Record<string, Species> = {
        dog: Species.DOG,
        DOG: Species.DOG,
        cat: Species.CAT,
        CAT: Species.CAT,
      }
      if (speciesMap[species]) {
        where.species = speciesMap[species]
      }
    }

    return this.prisma.breed.findMany({
      where,
      select: { id: true, name: true, species: true, size: true, group: true, isMixed: true },
      orderBy: [{ isMixed: 'asc' }, { name: 'asc' }],
    })
  }
}
