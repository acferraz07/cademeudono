'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Filter } from 'lucide-react'
import { petsApi, breedsApi } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { calculatePetAge, SPECIES_LABEL, SIZE_LABEL } from '@/lib/utils'
import type { Pet, Breed } from '@/types'

const SPECIES_EMOJI: Record<string, string> = { DOG: '🐕', CAT: '🐈', OTHER: '🐾' }

function AdoptionCard({ pet }: { pet: Pet }) {
  const photo = pet.profilePhotoUrl ?? pet.media?.[0]?.url
  const whatsapp = (pet as any).owner?.whatsapp ?? (pet as any).owner?.phonePrimary ?? ''
  const breedDisplay = pet.breedName ?? pet.breed

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="relative h-44 bg-gradient-to-br from-pink-50 to-rose-100">
        {photo ? (
          <Image src={photo} alt={pet.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">{SPECIES_EMOJI[pet.species] ?? '🐾'}</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {pet.isOng && (
            <Badge variant="success" className="text-[10px]">🟢 ONG</Badge>
          )}
          {pet.adoptionUrgency === 'urgent' && (
            <Badge variant="danger" className="text-[10px]">⚠️ Urgente</Badge>
          )}
          {pet.isInFosterHome && (
            <Badge variant="warning" className="text-[10px]">🏠 Lar temp.</Badge>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{pet.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {SPECIES_LABEL[pet.species]}
            {breedDisplay ? ` · ${breedDisplay}` : ''}
            {pet.size ? ` · ${SIZE_LABEL[pet.size]}` : ''}
          </p>
          {pet.birthDate && (
            <p className="text-xs text-gray-400 mt-0.5">{calculatePetAge(pet.birthDate)}</p>
          )}
          {(pet as any).owner?.city && (
            <p className="text-xs text-gray-400 mt-0.5">
              📍 {(pet as any).owner.city}
              {(pet as any).owner.state ? `/${(pet as any).owner.state}` : ''}
            </p>
          )}
        </div>

        {pet.adoptionStory && (
          <p className="text-xs text-gray-600 line-clamp-2">{pet.adoptionStory}</p>
        )}

        {pet.adoptionRequirements && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5">
            <span className="font-medium">Requisitos: </span>{pet.adoptionRequirements}
          </div>
        )}

        <div className="mt-auto pt-2 flex flex-col gap-2">
          <StatusBadge status="for_adoption" className="w-full justify-center" />
          <Link
            href={`/adocao/adotar/${pet.id}`}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
          >
            📋 Quero adotar
          </Link>
          {whatsapp && (
            <a
              href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1%21+Vi+o+${encodeURIComponent(pet.name)}+disponível+para+adoção+no+Cadê+Meu+Dono+e+gostaria+de+saber+mais.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
            >
              💬 Entrar em contato
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdocaoPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [filterSpecies, setFilterSpecies] = useState('')
  const [filterBreedId, setFilterBreedId] = useState('')
  const [filterSize, setFilterSize] = useState('')

  useEffect(() => {
    setLoading(true)
    petsApi
      .findForAdoption({
        species: filterSpecies || undefined,
        breedId: filterBreedId || undefined,
        size: filterSize || undefined,
      })
      .then(setPets)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filterSpecies, filterBreedId, filterSize])

  useEffect(() => {
    if (filterSpecies === 'DOG' || filterSpecies === 'CAT') {
      breedsApi.findAll(filterSpecies as 'DOG' | 'CAT').then(setBreeds).catch(() => {})
    } else {
      setBreeds([])
      setFilterBreedId('')
    }
  }, [filterSpecies])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏡 Adoção responsável</h1>
          <p className="text-sm text-gray-500 mt-1">Pets esperando por um lar cheio de amor</p>
        </div>
        <div className="flex gap-2">
          <Link href="/adocao/minhas" className="text-sm text-brand-600 hover:underline font-medium">
            Minhas adoções →
          </Link>
          <Link href="/adocao/adotados" className="text-sm text-brand-600 hover:underline font-medium">
            Ver adotados →
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtrar</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filterSpecies}
            onChange={(e) => { setFilterSpecies(e.target.value); setFilterBreedId('') }}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">Todas as espécies</option>
            <option value="DOG">🐕 Cão</option>
            <option value="CAT">🐈 Gato</option>
            <option value="OTHER">🐾 Outro</option>
          </select>

          {breeds.length > 0 && (
            <select
              value={filterBreedId}
              onChange={(e) => setFilterBreedId(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">Todas as raças</option>
              {breeds.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          <select
            value={filterSize}
            onChange={(e) => setFilterSize(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">Todos os portes</option>
            <option value="SMALL">Pequeno</option>
            <option value="MEDIUM">Médio</option>
            <option value="LARGE">Grande</option>
            <option value="GIANT">Gigante</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">🏡</p>
          <p className="font-medium text-gray-600">Nenhum pet disponível para adoção no momento</p>
          <p className="text-sm mt-2">
            Tem um pet para adotar?{' '}
            <Link href="/pets" className="text-brand-600 hover:underline">
              Cadastre em Meus Pets
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((p) => (
            <AdoptionCard key={p.id} pet={p} />
          ))}
        </div>
      )}
    </div>
  )
}
