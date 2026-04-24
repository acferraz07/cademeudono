import { PrismaClient, Species, PetSize } from '@prisma/client'

const prisma = new PrismaClient()

const dogBreeds: {
  name: string
  size: PetSize
  group?: string
  isMixed?: boolean
}[] = [
  // SRD primeiro
  { name: 'SRD (Sem Raça Definida)', size: PetSize.MEDIUM, isMixed: true },
  // Pequeno porte
  { name: 'Chihuahua', size: PetSize.SMALL, group: 'Toy' },
  { name: 'Yorkshire Terrier', size: PetSize.SMALL, group: 'Terrier' },
  { name: 'Maltês', size: PetSize.SMALL, group: 'Toy' },
  { name: 'Poodle Toy', size: PetSize.SMALL, group: 'Poodle' },
  { name: 'Poodle Miniatura', size: PetSize.SMALL, group: 'Poodle' },
  { name: 'Shih Tzu', size: PetSize.SMALL, group: 'Toy' },
  { name: 'Lhasa Apso', size: PetSize.SMALL, group: 'Non-Sporting' },
  { name: 'Pug', size: PetSize.SMALL, group: 'Toy' },
  { name: 'Dachshund (Salsicha)', size: PetSize.SMALL, group: 'Hound' },
  { name: 'Bichon Frisé', size: PetSize.SMALL, group: 'Non-Sporting' },
  { name: 'Pomerânia', size: PetSize.SMALL, group: 'Spitz' },
  { name: 'Jack Russell Terrier', size: PetSize.SMALL, group: 'Terrier' },
  { name: 'Schnauzer Miniatura', size: PetSize.SMALL, group: 'Terrier' },
  { name: 'Cocker Spaniel Americano', size: PetSize.SMALL, group: 'Sporting' },
  { name: 'Cocker Spaniel Inglês', size: PetSize.SMALL, group: 'Sporting' },
  { name: 'Beagle', size: PetSize.SMALL, group: 'Hound' },
  { name: 'Fox Paulistinha', size: PetSize.SMALL, group: 'Terrier' },
  // Médio porte
  { name: 'Poodle Médio', size: PetSize.MEDIUM, group: 'Poodle' },
  { name: 'Bulldog Francês', size: PetSize.MEDIUM, group: 'Non-Sporting' },
  { name: 'Bulldog Inglês', size: PetSize.MEDIUM, group: 'Non-Sporting' },
  { name: 'Basset Hound', size: PetSize.MEDIUM, group: 'Hound' },
  { name: 'Shar Pei', size: PetSize.MEDIUM, group: 'Non-Sporting' },
  { name: 'Chow Chow', size: PetSize.MEDIUM, group: 'Non-Sporting' },
  { name: 'Whippet', size: PetSize.MEDIUM, group: 'Hound' },
  { name: 'Vizsla', size: PetSize.MEDIUM, group: 'Sporting' },
  { name: 'Border Collie', size: PetSize.MEDIUM, group: 'Herding' },
  { name: 'Schnauzer Médio', size: PetSize.MEDIUM, group: 'Terrier' },
  { name: 'Australian Shepherd', size: PetSize.MEDIUM, group: 'Herding' },
  { name: 'Pit Bull (APBT)', size: PetSize.MEDIUM, group: 'Terrier' },
  { name: 'Staffordshire Bull Terrier', size: PetSize.MEDIUM, group: 'Terrier' },
  { name: 'Weimaraner', size: PetSize.MEDIUM, group: 'Sporting' },
  { name: 'Dalmatian', size: PetSize.MEDIUM, group: 'Non-Sporting' },
  // Grande porte
  { name: 'Labrador Retriever', size: PetSize.LARGE, group: 'Sporting' },
  { name: 'Golden Retriever', size: PetSize.LARGE, group: 'Sporting' },
  { name: 'Pastor Alemão', size: PetSize.LARGE, group: 'Herding' },
  { name: 'Rottweiler', size: PetSize.LARGE, group: 'Working' },
  { name: 'Doberman', size: PetSize.LARGE, group: 'Working' },
  { name: 'Boxer', size: PetSize.LARGE, group: 'Working' },
  { name: 'Husky Siberiano', size: PetSize.LARGE, group: 'Working' },
  { name: 'Malamute do Alasca', size: PetSize.LARGE, group: 'Working' },
  { name: 'Akita', size: PetSize.LARGE, group: 'Working' },
  { name: 'Poodle Grande', size: PetSize.LARGE, group: 'Poodle' },
  { name: 'Schnauzer Gigante', size: PetSize.LARGE, group: 'Working' },
  { name: 'Samoyeda', size: PetSize.LARGE, group: 'Working' },
  { name: 'Fila Brasileiro', size: PetSize.LARGE, group: 'Working' },
  { name: 'Pastor Belga Malinois', size: PetSize.LARGE, group: 'Herding' },
  { name: 'Dogo Argentino', size: PetSize.LARGE, group: 'Working' },
  // Gigante
  { name: 'Grande Dinamarquês (Dogue Alemão)', size: PetSize.GIANT, group: 'Working' },
  { name: 'São Bernardo', size: PetSize.GIANT, group: 'Working' },
  { name: 'Newfoundland', size: PetSize.GIANT, group: 'Working' },
  { name: 'Mastim Inglês', size: PetSize.GIANT, group: 'Working' },
  { name: 'Mastim Napolitano', size: PetSize.GIANT, group: 'Working' },
]

const catBreeds: {
  name: string
  size: PetSize
  group?: string
  isMixed?: boolean
}[] = [
  // SRD primeiro
  { name: 'SRD (Sem Raça Definida)', size: PetSize.MEDIUM, isMixed: true },
  // Raças
  { name: 'Persa', size: PetSize.MEDIUM },
  { name: 'Siamês', size: PetSize.MEDIUM },
  { name: 'Maine Coon', size: PetSize.LARGE },
  { name: 'Bengal', size: PetSize.MEDIUM },
  { name: 'British Shorthair', size: PetSize.MEDIUM },
  { name: 'Ragdoll', size: PetSize.LARGE },
  { name: 'Russian Blue', size: PetSize.MEDIUM },
  { name: 'Devon Rex', size: PetSize.SMALL },
  { name: 'Sphynx (Esfinge)', size: PetSize.MEDIUM },
  { name: 'Birmanês', size: PetSize.MEDIUM },
  { name: 'Angorá Turco', size: PetSize.MEDIUM },
  { name: 'Scottish Fold', size: PetSize.MEDIUM },
  { name: 'Abissínio', size: PetSize.MEDIUM },
  { name: 'American Shorthair', size: PetSize.MEDIUM },
  { name: 'Norueguês da Floresta', size: PetSize.LARGE },
  { name: 'Savannah', size: PetSize.LARGE },
  { name: 'Munchkin', size: PetSize.SMALL },
  { name: 'Somali', size: PetSize.MEDIUM },
  { name: 'Tonquinês', size: PetSize.MEDIUM },
  { name: 'Oriental Shorthair', size: PetSize.MEDIUM },
]

async function main() {
  console.log('🌱 Iniciando seed de raças...')

  // Inserir raças de cães
  let dogCount = 0
  for (const breed of dogBreeds) {
    await prisma.breed.upsert({
      where: { name_species: { name: breed.name, species: Species.DOG } },
      update: { size: breed.size, group: breed.group ?? null, isMixed: breed.isMixed ?? false },
      create: {
        name: breed.name,
        species: Species.DOG,
        size: breed.size,
        group: breed.group ?? null,
        isMixed: breed.isMixed ?? false,
      },
    })
    dogCount++
  }

  // Inserir raças de gatos
  let catCount = 0
  for (const breed of catBreeds) {
    await prisma.breed.upsert({
      where: { name_species: { name: breed.name, species: Species.CAT } },
      update: { size: breed.size, group: breed.group ?? null, isMixed: breed.isMixed ?? false },
      create: {
        name: breed.name,
        species: Species.CAT,
        size: breed.size,
        group: breed.group ?? null,
        isMixed: breed.isMixed ?? false,
      },
    })
    catCount++
  }

  console.log(`✅ ${dogCount} raças de cães inseridas/atualizadas`)
  console.log(`✅ ${catCount} raças de gatos inseridas/atualizadas`)
  console.log('🎉 Seed concluído!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
