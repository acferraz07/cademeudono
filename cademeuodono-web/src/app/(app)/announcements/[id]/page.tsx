'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Phone,
  Eye,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { announcementsApi } from '@/lib/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { SPECIES_LABEL, SIZE_LABEL, formatDate, formatPhone } from '@/lib/utils'
import type { Announcement } from '@/types'

const STATUS_LABEL: Record<Announcement['status'], string> = {
  ACTIVE: 'Ativo',
  RESOLVED: 'Resolvido',
  RETURNED_TO_OWNER: 'Retornou ao tutor',
  ARCHIVED: 'Arquivado',
}

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐕',
  CAT: '🐈',
  OTHER: '🐾',
}

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, token } = useAuth()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [matches, setMatches] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!token || !params.id) return
    announcementsApi
      .findOne(token, params.id)
      .then((a) => {
        setAnnouncement(a)
        announcementsApi.findMatches(token, params.id).then(setMatches).catch(() => {})
      })
      .catch(() => setError('Anúncio não encontrado'))
      .finally(() => setLoading(false))
  }, [token, params.id])

  async function handleMarkResolved() {
    if (!token || !announcement) return
    setActionLoading(true)
    try {
      const updated = await announcementsApi.updateStatus(token, announcement.id, 'RETURNED_TO_OWNER')
      setAnnouncement(updated)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!token || !announcement) return
    if (!confirm('Remover este anúncio?')) return
    setActionLoading(true)
    try {
      await announcementsApi.remove(token, announcement.id)
      router.push('/announcements')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !announcement) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={40} className="text-rose-300 mb-4" />
        <p className="font-medium text-gray-900">{error || 'Anúncio não encontrado'}</p>
        <Link href="/announcements" className="mt-4 text-sm text-brand-600 hover:underline">
          Voltar para anúncios
        </Link>
      </div>
    )
  }

  const a = announcement
  const isOwner = user?.id === a.ownerId
  const isLost = a.type === 'LOST'
  const photo = a.petPhotoUrl ?? a.images?.[0]?.url

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/announcements" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {a.petName ?? SPECIES_LABEL[a.species]}
            </h1>
            <Badge variant={isLost ? 'lost' : 'found'}>
              {isLost ? '🔴 Perdido' : '🟢 Encontrado'}
            </Badge>
            {a.status !== 'ACTIVE' && (
              <Badge variant="default">{STATUS_LABEL[a.status]}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Photo */}
      {photo ? (
        <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-gray-100">
          <Image src={photo} alt={a.petName ?? 'Pet'} fill className="object-cover" />
        </div>
      ) : (
        <div className="h-40 rounded-2xl bg-gradient-to-br from-brand-50 to-amber-50 flex items-center justify-center">
          <span className="text-7xl">{SPECIES_EMOJI[a.species] ?? '🐾'}</span>
        </div>
      )}

      {/* Info */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Informações do pet</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <InfoRow label="Espécie" value={SPECIES_LABEL[a.species]} />
          {a.breed && <InfoRow label="Raça" value={a.breed} />}
          {a.size && <InfoRow label="Porte" value={SIZE_LABEL[a.size]} />}
          {a.eyeColor && <InfoRow label="Olhos" value={a.eyeColor} />}
          {a.coatColor?.length > 0 && (
            <InfoRow label="Pelagem" value={a.coatColor.join(', ')} />
          )}
        </dl>
        {a.specificMarks && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-400 mb-1">Marcas específicas</p>
            <p className="text-sm text-gray-700">{a.specificMarks}</p>
          </div>
        )}
      </Card>

      {/* Location */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin size={15} className="text-gray-400" />
          Localização
        </h2>
        <p className="text-sm text-gray-700">
          {[a.neighborhood, a.city, a.state].filter(Boolean).join(', ')}
        </p>
        {a.street && <p className="text-xs text-gray-500 mt-1">{a.street}</p>}
        {a.locationNotes && (
          <p className="text-xs text-gray-500 mt-2 italic">{a.locationNotes}</p>
        )}
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={12} />
          <span>
            {isLost ? 'Desapareceu em' : 'Encontrado em'} {formatDate(a.eventDate)}
          </span>
        </div>
      </Card>

      {/* Contact */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Phone size={15} className="text-gray-400" />
          Contato
        </h2>
        {a.contactName && (
          <p className="text-sm font-medium text-gray-900 mb-1">{a.contactName}</p>
        )}
        <a
          href={`https://wa.me/55${a.contactPhone.replace(/\D/g, '')}?text=Ol%C3%A1%2C+vi+seu+an%C3%BAncio+no+Cad%C3%AA+Meu+Dono+sobre+${encodeURIComponent(a.petName ?? 'o pet')}.`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-emerald-600 font-medium hover:underline"
        >
          {formatPhone(a.contactPhone)}
        </a>
      </Card>

      {/* Stats */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
        <Eye size={12} />
        <span>{a.viewsCount} visualizações</span>
        <span className="mx-1">·</span>
        <span>Publicado em {formatDate(a.createdAt)}</span>
        <span className="mx-1">·</span>
        <span>por {a.owner?.fullName}</span>
      </div>

      {/* Potential matches */}
      {matches.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-lg">🔍</span>
            Possíveis correspondências ({matches.length})
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {isLost
              ? 'Pets encontrados na mesma cidade que podem ser o seu'
              : 'Anúncios de pets perdidos que podem corresponder a este'}
          </p>
          <div className="space-y-3">
            {matches.map((m) => {
              const mPhoto = m.petPhotoUrl ?? m.images?.[0]?.url
              return (
                <Link
                  key={m.id}
                  href={`/announcements/${m.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {mPhoto ? (
                      <Image src={mPhoto} alt="" width={48} height={48} className="w-12 h-12 object-cover" unoptimized />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center text-2xl">
                        {SPECIES_EMOJI[m.species] ?? '🐾'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {m.petName ?? SPECIES_LABEL[m.species]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {[m.neighborhood, m.city].filter(Boolean).join(', ')} · {formatDate(m.eventDate)}
                    </p>
                  </div>
                  <Badge variant={m.type === 'LOST' ? 'lost' : 'found'} className="shrink-0">
                    {m.type === 'LOST' ? 'Perdido' : 'Encontrado'}
                  </Badge>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      {/* Owner actions */}
      {isOwner && (
        <div className="flex flex-wrap gap-3 pb-8">
          {a.status === 'ACTIVE' && (
            <Button
              variant="secondary"
              onClick={handleMarkResolved}
              loading={actionLoading}
            >
              <CheckCircle2 size={16} />
              Marcar como resolvido
            </Button>
          )}
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={actionLoading}
          >
            <Trash2 size={16} />
            Remover anúncio
          </Button>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-700 mt-0.5">{value}</dd>
    </div>
  )
}
