'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus, Megaphone, Tag, TrendingUp, PawPrint } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { usersApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { PetCard } from '@/components/pets/pet-card'
import { AnnouncementCard } from '@/components/announcements/announcement-card'
import type { Pet, Announcement } from '@/types'

export default function DashboardPage() {
  const { user, token } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    Promise.all([usersApi.getMyPets(token), usersApi.getMyAnnouncements(token)])
      .then(([p, a]) => {
        setPets(p)
        setAnnouncements(a)
      })
      .finally(() => setLoading(false))
  }, [token])

  const activeAnnouncements = announcements.filter((a) => a.status === 'ACTIVE')
  const firstName = user?.fullName?.split(' ')[0] ?? 'Tutor'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {firstName}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Bem-vindo de volta à plataforma Cadê Meu Dono
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<PawPrint size={20} className="text-brand-500" />}
          label="Pets cadastrados"
          value={loading ? '—' : String(pets.length)}
          bg="bg-brand-50"
        />
        <StatCard
          icon={<Megaphone size={20} className="text-rose-500" />}
          label="Anúncios ativos"
          value={loading ? '—' : String(activeAnnouncements.length)}
          bg="bg-rose-50"
        />
        <StatCard
          icon={<Tag size={20} className="text-emerald-500" />}
          label="Tags ativas"
          value={loading ? '—' : String(pets.flatMap((p) => p.smartTags ?? []).filter((t) => t.status === 'ACTIVE').length)}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-sky-500" />}
          label="Pets ajudados"
          value={String(announcements.filter((a) => a.status === 'RETURNED_TO_OWNER').length)}
          bg="bg-sky-50"
        />
      </div>

      {/* Quick actions */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/pets/new" className={buttonVariants({ variant: 'primary' })}>
            <Plus size={16} />
            Cadastrar pet
          </Link>
          <Link href="/announcements/new?type=LOST" className={buttonVariants({ variant: 'outline' })}>
            <Megaphone size={16} />
            Pet perdido
          </Link>
          <Link href="/announcements/new?type=FOUND" className={buttonVariants({ variant: 'outline' })}>
            <Megaphone size={16} />
            Pet encontrado
          </Link>
          <Link href="/tags/activate" className={buttonVariants({ variant: 'secondary' })}>
            <Tag size={16} />
            Ativar smart tag
          </Link>
        </div>
      </Card>

      {/* My pets */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Meus pets</h2>
          <Link href="/pets" className="text-sm text-brand-600 hover:underline font-medium">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : pets.length === 0 ? (
          <EmptyState
            emoji="🐾"
            title="Nenhum pet cadastrado"
            description="Cadastre seu primeiro pet para começar"
            action={{ label: 'Cadastrar pet', href: '/pets/new' }}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {pets.slice(0, 4).map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </section>

      {/* Recent announcements */}
      {announcements.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Meus anúncios recentes</h2>
            <Link href="/announcements" className="text-sm text-brand-600 hover:underline font-medium">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.slice(0, 3).map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bg: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string
  title: string
  description: string
  action: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
      <span className="text-4xl mb-3">{emoji}</span>
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>
      <Link href={action.href} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
        {action.label}
      </Link>
    </div>
  )
}
