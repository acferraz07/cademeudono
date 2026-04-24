'use client'

import { useEffect, useState } from 'react'
import { breedsApi } from '@/lib/api'
import { Select, Input } from '@/components/ui/input'
import type { Breed } from '@/types'

interface BreedSelectorProps {
  species: 'DOG' | 'CAT' | 'OTHER' | ''
  breedId?: string
  breed?: string
  onBreedIdChange: (id: string) => void
  onBreedChange: (text: string) => void
  error?: string
}

export function BreedSelector({
  species,
  breedId,
  breed,
  onBreedIdChange,
  onBreedChange,
  error,
}: BreedSelectorProps) {
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (species !== 'DOG' && species !== 'CAT') {
      setBreeds([])
      return
    }
    setLoading(true)
    breedsApi
      .findAll(species)
      .then(setBreeds)
      .catch(() => setBreeds([]))
      .finally(() => setLoading(false))
  }, [species])

  if (species === 'OTHER') {
    return (
      <Input
        label="Raça / espécie"
        placeholder="Digite a raça ou espécie"
        value={breed ?? ''}
        onChange={(e) => onBreedChange(e.target.value)}
        error={error}
      />
    )
  }

  if (species === 'DOG' || species === 'CAT') {
    return (
      <Select
        label="Raça"
        value={breedId ?? ''}
        onChange={(e) => onBreedIdChange(e.target.value)}
        error={error}
        disabled={loading}
      >
        <option value="">{loading ? 'Carregando raças...' : 'Selecione a raça'}</option>
        {breeds.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
    )
  }

  return (
    <Input
      label="Raça"
      placeholder="Selecione a espécie primeiro"
      disabled
      value=""
      onChange={() => {}}
    />
  )
}
