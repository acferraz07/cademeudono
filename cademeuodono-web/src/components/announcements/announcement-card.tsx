import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Calendar, Eye } from 'lucide-react'
import { SPECIES_LABEL, SIZE_LABEL, formatDate, formatPhone } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Announcement } from '@/types'

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐕',
  CAT: '🐈',
  OTHER: '🐾',
}

interface AnnouncementCardProps {
  announcement: Announcement
}

export function AnnouncementCard({ announcement: a }: AnnouncementCardProps) {
  const photo = a.petPhotoUrl ?? a.images?.[0]?.url
  const isLost = a.type === 'LOST'

  return (
    <Link
      href={`/announcements/${a.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Photo */}
      <div className="relative h-44 bg-gradient-to-br from-gray-50 to-gray-100">
        {photo ? (
          <Image src={photo} alt={a.petName ?? 'Pet'} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">{SPECIES_EMOJI[a.species] ?? '🐾'}</span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge variant={isLost ? 'lost' : 'found'} className="text-xs font-semibold">
            {isLost ? '🔴 Perdido' : '🟢 Encontrado'}
          </Badge>
          {a.isFeatured && (
            <Badge variant="warning" className="text-[10px]">
              ⭐ Destaque
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">
          {a.petName ?? SPECIES_LABEL[a.species]}
          {a.breed ? ` · ${a.breed}` : ''}
        </h3>

        {a.specificMarks && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.specificMarks}</p>
        )}

        <div className="mt-3 flex flex-col gap-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">
              {a.neighborhood ? `${a.neighborhood}, ` : ''}
              {a.city} — {a.state}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="shrink-0" />
            <span>{formatDate(a.eventDate)}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Eye size={12} />
            <span>{a.viewsCount} visualizações</span>
          </div>
          <div className="flex gap-1.5">
            {a.size && (
              <Badge variant="default" className="text-[10px]">
                {SIZE_LABEL[a.size]}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
