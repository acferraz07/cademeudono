'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Tag, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { usersApi } from '@/lib/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import type { Pet, SmartTag } from '@/types'

type TagWithPet = SmartTag & { pet?: { id: string; name: string } }

const TAG_STATUS_LABEL: Record<SmartTag['status'], string> = {
  AVAILABLE: 'Disponível',
  SOLD: 'Aguardando ativação',
  ACTIVATION_PENDING: 'Ativação pendente',
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
}

const TAG_STATUS_VARIANT: Record<SmartTag['status'], 'success' | 'warning' | 'danger' | 'default'> = {
  AVAILABLE: 'default',
  SOLD: 'warning',
  ACTIVATION_PENDING: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'danger',
}

export default function TagsPage() {
  const { token } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    usersApi.getMyPets(token).then(setPets).finally(() => setLoading(false))
  }, [token])

  const allTags: TagWithPet[] = pets.flatMap((pet) =>
    (pet.smartTags ?? []).map((tag) => ({ ...tag, pet: { id: pet.id, name: pet.name } })),
  )

  const activeTags = allTags.filter((t) => t.status === 'ACTIVE')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Tags</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeTags.length} {activeTags.length === 1 ? 'tag ativa' : 'tags ativas'}
          </p>
        </div>
        <Link href="/tags/activate" className={buttonVariants({ variant: 'primary' })}>
          <Plus size={16} />
          Ativar tag
        </Link>
      </div>

      {/* How it works */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
        <h2 className="font-semibold text-brand-900 text-sm mb-2 flex items-center gap-2">
          <Tag size={15} />
          Como funciona
        </h2>
        <p className="text-sm text-brand-700">
          Cada Smart Tag possui um código único. Ao ser escaneada por qualquer pessoa com um celular,
          exibe a ficha do seu pet e um botão para entrar em contato via WhatsApp — sem precisar
          instalar nenhum aplicativo.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : allTags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
            <Tag size={28} className="text-brand-400" />
          </div>
          <p className="font-semibold text-gray-900 text-lg">Nenhuma tag vinculada</p>
          <p className="text-sm text-gray-500 mt-2 mb-6 max-w-xs">
            Ative uma Smart Tag com o código que veio no seu pedido para vincular ao pet
          </p>
          <Link href="/tags/activate" className={buttonVariants({ variant: 'primary' })}>
            <Plus size={16} />
            Ativar minha primeira tag
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTags.map((tag) => (
            <TagCard key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </div>
  )
}

function TagCard({ tag }: { tag: TagWithPet }) {
  const StatusIcon =
    tag.status === 'ACTIVE'
      ? CheckCircle2
      : tag.status === 'INACTIVE'
        ? XCircle
        : Clock

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <Tag size={18} className="text-brand-500" />
        </div>
        <Badge variant={TAG_STATUS_VARIANT[tag.status]}>
          <StatusIcon size={11} />
          {TAG_STATUS_LABEL[tag.status]}
        </Badge>
      </div>

      <p className="font-mono font-bold text-gray-900 text-lg tracking-widest">{tag.code}</p>

      {tag.pet && (
        <p className="text-sm text-gray-500 mt-1">
          Vinculada a{' '}
          <Link href={`/pets/${tag.pet.id}`} className="font-medium text-brand-600 hover:underline">
            {tag.pet.name}
          </Link>
        </p>
      )}

      {tag.activatedAt && (
        <p className="text-xs text-gray-400 mt-2">
          Ativada em {new Date(tag.activatedAt).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  )
}
