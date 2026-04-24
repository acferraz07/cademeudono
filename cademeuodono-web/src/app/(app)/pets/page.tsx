'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { petsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { PetCard } from '@/components/pets/pet-card'
import type { Pet } from '@/types'

export default function PetsPage() {
  const { token } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    petsApi.findAll(token).then(setPets).finally(() => setLoading(false))
  }, [token])

  async function handleDelete(id: string) {
    if (!token || !confirm('Remover este pet? Esta ação pode ser desfeita pelo suporte.')) return
    await petsApi.remove(token, id)
    setPets((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Pets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pets.length} {pets.length === 1 ? 'pet cadastrado' : 'pets cadastrados'}
          </p>
        </div>
        <Button asChild>
          <Link href="/pets/new">
            <Plus size={16} />
            Novo pet
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="text-5xl mb-4">🐾</span>
          <p className="font-semibold text-gray-900 text-lg">Nenhum pet cadastrado ainda</p>
          <p className="text-sm text-gray-500 mt-2 mb-6 max-w-xs">
            Cadastre seu pet para criar a ficha digital e vincular uma smart tag
          </p>
          <Button asChild>
            <Link href="/pets/new">
              <Plus size={16} />
              Cadastrar meu primeiro pet
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
