'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, MapPin, Phone, Globe, Instagram, Plus } from 'lucide-react'
import { orgProtectorsApi } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { OrgProtector } from '@/types'

const TYPE_LABEL: Record<string, string> = { ONG: '🏢 ONG', PROTETOR: '🤝 Protetor(a)' }

export default function OngsProtetoresPage() {
  const [items, setItems] = useState<OrgProtector[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    orgProtectorsApi
      .findAll(filterType ? { type: filterType } : undefined)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filterType])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏢 ONGs e Protetores</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organizações e protetores independentes que cuidam dos pets
          </p>
        </div>
        <Link href="/ongs-protetores/new">
          <Button size="sm">
            <Plus size={16} className="mr-1" /> Cadastrar
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-5">
        {['', 'ONG', 'PROTETOR'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterType === t
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === '' ? 'Todos' : t === 'ONG' ? '🏢 ONGs' : '🤝 Protetores'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">🏢</p>
          <p className="font-medium text-gray-600">Nenhum resultado encontrado</p>
          <p className="text-sm mt-2">
            Seja o primeiro a{' '}
            <Link href="/ongs-protetores/new" className="text-brand-600 hover:underline">
              cadastrar uma ONG ou Protetor
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((org) => (
            <Card key={org.id} className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {org.logoUrl ? (
                  <Image
                    src={org.logoUrl}
                    alt={org.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <Building2 size={22} className="text-brand-600" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                  <span className="text-xs font-medium text-gray-500">{TYPE_LABEL[org.type] ?? org.type}</span>
                </div>
              </div>

              {org.description && (
                <p className="text-xs text-gray-600 line-clamp-2">{org.description}</p>
              )}

              <div className="space-y-1 text-xs text-gray-500">
                <p className="flex items-center gap-1.5">
                  <MapPin size={12} /> {[org.neighborhood, org.city, org.state].filter(Boolean).join(', ')}
                </p>
                {org.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone size={12} /> {org.phone}
                  </p>
                )}
                {org.website && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Globe size={12} />
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline truncate">
                      {org.website.replace(/^https?:\/\//, '')}
                    </a>
                  </p>
                )}
                {org.instagram && (
                  <p className="flex items-center gap-1.5">
                    <Instagram size={12} />
                    <span className="text-brand-600">@{org.instagram.replace('@', '')}</span>
                  </p>
                )}
              </div>

              {org.actingSpecies?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {org.actingSpecies.map((s) => (
                    <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {s === 'DOG' ? '🐕 Cão' : s === 'CAT' ? '🐈 Gato' : s}
                    </span>
                  ))}
                </div>
              )}

              {org.donationInfo && (
                <div className="text-xs bg-amber-50 text-amber-800 rounded-lg px-3 py-2">
                  💛 {org.donationInfo}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
