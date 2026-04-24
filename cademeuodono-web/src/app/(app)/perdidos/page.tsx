'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { announcementsApi } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, SPECIES_LABEL, SIZE_LABEL } from '@/lib/utils'
import type { Announcement } from '@/types'

const SPECIES_EMOJI: Record<string, string> = { DOG: '🐕', CAT: '🐈', OTHER: '🐾' }

export default function PerdidosPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    announcementsApi
      .findAll(token, { type: 'LOST', status: 'ACTIVE', limit: 50 })
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚨 Pets perdidos</h1>
          <p className="text-sm text-gray-500 mt-1">Esses pets fugiram de casa e seus tutores estão à procura deles</p>
        </div>
        <Link href="/encontrados" className="text-sm text-brand-600 hover:underline font-medium">
          Ver encontrados →
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">🐾</p>
          <p className="font-medium text-gray-600">Nenhum pet perdido ativo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((a) => {
            const photo = a.petPhotoUrl ?? a.images?.[0]?.url
            return (
              <Link
                key={a.id}
                href={`/announcements/${a.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
              >
                <div className="relative h-40 bg-gradient-to-br from-blue-50 to-sky-100">
                  {photo ? (
                    <Image src={photo} alt={a.petName ?? ''} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl">{SPECIES_EMOJI[a.species] ?? '🐾'}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.petName ?? SPECIES_LABEL[a.species]}</h3>
                    <p className="text-xs text-gray-500">
                      {SPECIES_LABEL[a.species]}
                      {a.breed ? ` · ${a.breed}` : ''}
                      {a.size ? ` · ${SIZE_LABEL[a.size]}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      📍 {[a.neighborhood, a.city, a.state].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-xs text-gray-400">
                      Desapareceu em {formatDate(a.eventDate)}
                    </p>
                  </div>
                  <StatusBadge status="lost" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
