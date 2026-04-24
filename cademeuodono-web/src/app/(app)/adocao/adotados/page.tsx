'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { petsApi } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, SPECIES_LABEL } from '@/lib/utils'
import type { Pet } from '@/types'

const SPECIES_EMOJI: Record<string, string> = { DOG: '🐕', CAT: '🐈', OTHER: '🐾' }

export default function AdotadosPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    petsApi.findAdopted()
      .then(setPets)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/adocao" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏡 Adoções realizadas ❤️</h1>
          <p className="text-sm text-gray-500 mt-1">Pets que encontraram seu lar definitivo</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">❤️</p>
          <p className="font-medium text-gray-600">Nenhuma adoção registrada ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((p) => {
            const photo = p.profilePhotoUrl ?? p.media?.[0]?.url
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="relative h-40 bg-gradient-to-br from-emerald-50 to-teal-100">
                  {photo ? (
                    <Image src={photo} alt={p.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl">{SPECIES_EMOJI[p.species] ?? '🐾'}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-500">
                      {SPECIES_LABEL[p.species]}
                      {p.breed ? ` · ${p.breed}` : ''}
                    </p>
                  </div>
                  <StatusBadge status="adopted" />
                  {p.adoptedAt && (
                    <p className="text-xs text-gray-400">Adotado em {formatDate(p.adoptedAt)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
