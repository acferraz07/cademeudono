'use client'

import { useEffect, useState } from 'react'
import { Input, Select } from '@/components/ui/input'
import { BRAZIL_STATES } from '@/lib/utils'

export const PALMAS_NEIGHBORHOODS = [
  'Plano Diretor Sul',
  'Plano Diretor Norte',
  'Taquaralto',
  'Aureny I',
  'Aureny II',
  'Aureny III',
  'Aureny IV',
  'Jardim Aureny I',
  'Jardim Aureny II',
  'Jardim Aureny III',
  'Jardim Aureny IV',
  'Santa Bárbara',
  'Lago Norte',
  'Jardins dos Ipês',
  'Morada do Sol',
  'Taquari',
  'Irmã Dulce',
  'Santa Fé',
  'Jardins do Oriente',
  'Outro',
] as const

interface IbgeCity {
  id: number
  nome: string
}

const cityCache: Record<string, string[]> = {}

async function fetchCities(uf: string): Promise<string[]> {
  if (cityCache[uf]) return cityCache[uf]
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
    )
    const data: IbgeCity[] = await res.json()
    const names = data.map((c) => c.nome)
    cityCache[uf] = names
    return names
  } catch {
    return []
  }
}

export interface LocationValue {
  state?: string
  city?: string
  neighborhood?: string
  block?: string
  lotNumber?: string
  street?: string
  streetNumber?: string
  complement?: string
}

interface LocationSelectorProps {
  value: LocationValue
  onChange: (field: keyof LocationValue, value: string) => void
  errors?: Partial<Record<keyof LocationValue, string | undefined>>
  showBlock?: boolean
  showLotNumber?: boolean
  showStreet?: boolean
  showStreetNumber?: boolean
  showComplement?: boolean
  requiredState?: boolean
  requiredCity?: boolean
}

export function LocationSelector({
  value,
  onChange,
  errors,
  showBlock,
  showLotNumber,
  showStreet,
  showStreetNumber,
  showComplement,
  requiredState,
  requiredCity,
}: LocationSelectorProps) {
  const [cities, setCities] = useState<string[]>([])
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => {
    if (!value.state) {
      setCities([])
      return
    }
    setLoadingCities(true)
    fetchCities(value.state)
      .then(setCities)
      .finally(() => setLoadingCities(false))
  }, [value.state])

  const isPalmas =
    value.state === 'TO' &&
    value.city?.trim().toLowerCase() === 'palmas'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Select
        label="Estado"
        required={requiredState}
        error={errors?.state}
        value={value.state ?? ''}
        onChange={(e) => {
          onChange('state', e.target.value)
          onChange('city', '')
          onChange('neighborhood', '')
        }}
      >
        <option value="">Selecione</option>
        {BRAZIL_STATES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>

      {value.state && cities.length > 0 ? (
        <Select
          label="Cidade"
          required={requiredCity}
          error={errors?.city}
          value={value.city ?? ''}
          onChange={(e) => {
            onChange('city', e.target.value)
            onChange('neighborhood', '')
          }}
          disabled={loadingCities}
        >
          <option value="">{loadingCities ? 'Carregando...' : 'Selecione a cidade'}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          label="Cidade"
          placeholder="Palmas"
          required={requiredCity}
          error={errors?.city}
          value={value.city ?? ''}
          onChange={(e) => {
            onChange('city', e.target.value)
            onChange('neighborhood', '')
          }}
          hint={loadingCities ? 'Carregando cidades...' : undefined}
        />
      )}

      {isPalmas ? (
        <Select
          label="Bairro / Região"
          error={errors?.neighborhood}
          value={value.neighborhood ?? ''}
          onChange={(e) => onChange('neighborhood', e.target.value)}
        >
          <option value="">Selecione o bairro</option>
          {PALMAS_NEIGHBORHOODS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          label="Bairro / Região"
          placeholder="Nome do bairro"
          error={errors?.neighborhood}
          value={value.neighborhood ?? ''}
          onChange={(e) => onChange('neighborhood', e.target.value)}
        />
      )}

      {showBlock && (
        <Input
          label="Quadra"
          placeholder={isPalmas ? 'Quadra 304 Sul' : 'Quadra ou bloco'}
          hint="Digite ou selecione. Ex: Quadra 304 Sul"
          error={errors?.block}
          value={value.block ?? ''}
          onChange={(e) => onChange('block', e.target.value)}
        />
      )}

      {showLotNumber && (
        <Input
          label="Lote"
          placeholder="10"
          hint="Número do lote (alfanumérico)"
          error={errors?.lotNumber}
          value={value.lotNumber ?? ''}
          onChange={(e) => onChange('lotNumber', e.target.value)}
        />
      )}

      {showStreet && (
        <Input
          label="Rua / Alameda"
          placeholder={isPalmas ? 'Alameda 5' : 'Nome da rua'}
          error={errors?.street}
          value={value.street ?? ''}
          onChange={(e) => onChange('street', e.target.value)}
        />
      )}

      {showStreetNumber && (
        <Input
          label="Número"
          placeholder="12A"
          hint="Aceita letras e números. Ex: 12, 12A, S/N"
          error={errors?.streetNumber}
          value={value.streetNumber ?? ''}
          onChange={(e) => onChange('streetNumber', e.target.value)}
        />
      )}

      {showComplement && (
        <Input
          label="Complemento"
          placeholder="Casa, Apto 302, Fundo, Bloco B"
          error={errors?.complement}
          value={value.complement ?? ''}
          onChange={(e) => onChange('complement', e.target.value)}
        />
      )}
    </div>
  )
}
