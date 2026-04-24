'use client'

import { useEffect, useState } from 'react'
import {
  PawPrint,
  Megaphone,
  Tag,
  Heart,
  User,
  Camera,
  CheckCircle2,
  Edit3,
  ImagePlus,
  Activity,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { usersApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import type { ActivityLog } from '@/types'

const ACTIVITY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  PET_CREATE:            { icon: <PawPrint size={16} />, color: 'text-brand-600', bg: 'bg-brand-50' },
  PET_UPDATE:            { icon: <Edit3 size={16} />, color: 'text-sky-600', bg: 'bg-sky-50' },
  PET_PHOTO_UPLOAD:      { icon: <ImagePlus size={16} />, color: 'text-violet-600', bg: 'bg-violet-50' },
  PET_ADOPTED:           { icon: <Heart size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  PET_RETURNED:          { icon: <CheckCircle2 size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  TAG_ACTIVATED:         { icon: <Tag size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ANNOUNCEMENT_LOST:     { icon: <Megaphone size={16} />, color: 'text-rose-600', bg: 'bg-rose-50' },
  ANNOUNCEMENT_FOUND:    { icon: <Megaphone size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
  ANNOUNCEMENT_STATUS:   { icon: <CheckCircle2 size={16} />, color: 'text-teal-600', bg: 'bg-teal-50' },
  ADOPTION_REQUEST:      { icon: <Heart size={16} />, color: 'text-pink-600', bg: 'bg-pink-50' },
  PROFILE_UPDATE:        { icon: <User size={16} />, color: 'text-gray-600', bg: 'bg-gray-100' },
  AVATAR_UPLOAD:         { icon: <Camera size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
}

const DEFAULT_CONFIG = {
  icon: <Activity size={16} />,
  color: 'text-gray-500',
  bg: 'bg-gray-100',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ActivitiesPage() {
  const { token } = useAuth()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    usersApi
      .getMyActivities(token, 50)
      .then(setActivities)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minhas atividades</h1>
        <p className="text-sm text-gray-500 mt-1">Histórico das suas ações na plataforma</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Activity size={22} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">Nenhuma atividade registrada</p>
            <p className="text-sm text-gray-500 mt-1">
              Suas ações aparecerão aqui conforme você usar a plataforma.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="divide-y divide-gray-50">
          {activities.map((activity) => {
            const cfg = ACTIVITY_CONFIG[activity.type] ?? DEFAULT_CONFIG
            return (
              <div key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <span className={cfg.color}>{cfg.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(activity.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
