'use client'

import { useEffect, useState } from 'react'
import { Input, Select } from '@/components/ui/input'
import { BRAZIL_STATES } from '@/lib/utils'
import { PALMAS_LOCATIONS, PALMAS_REGIONS } from '@/data/palmas-locations'

// Kept for external backward compatibility
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

const OTHER_BLOCK = '__outro__'

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
  const [blockFreeText, setBlockFreeText] = useState(false)

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

  // Reset free-text mode when region changes
  useEffect(() => {
    setBlockFreeText(false)
  }, [value.neighborhood])

  const isPalmas =
    value.state === 'TO' && value.city?.trim().toLowerCase() === 'palmas'

  const isRural = isPalmas && value.neighborhood === 'Rural'

  const palmasBlocks: string[] =
    isPalmas && value.neighborhood && value.neighborhood in PALMAS_LOCATIONS
      ? PALMAS_LOCATIONS[value.neighborhood]
      : []

  // If the stored block is not in the current region's list, show free-text input
  const blockNotInList =
    !!value.block && palmasBlocks.length > 0 && !palmasBlocks.includes(value.block)
  const showBlockFreeText = blockFreeText || blockNotInList

  // Show Palmas block selector when a non-Rural region is selected
  const showPalmasBlock = isPalmas && !!value.neighborhood && !isRural

  function handleStateChange(newState: string) {
    onChange('state', newState)
    onChange('city', '')
    onChange('neighborhood', '')
    onChange('block', '')
  }

  function handleCityChange(newCity: string) {
    onChange('city', newCity)
    onChange('neighborhood', '')
    onChange('block', '')
  }

  function handleNeighborhoodChange(newNeighborhood: string) {
    onChange('neighborhood', newNeighborhood)
    onChange('block', '')
  }

  function handleBlockSelectChange(selected: string) {
    if (selected === OTHER_BLOCK) {
      setBlockFreeText(true)
      onChange('block', '')
    } else {
      onChange('block', selected)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Estado */}
      <Select
        label="Estado"
        required={requiredState}
        error={errors?.state}
        value={value.state ?? ''}
        onChange={(e) => handleStateChange(e.target.value)}
      >
        <option value="">Selecione</option>
        {BRAZIL_STATES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>

      {/* Cidade */}
      {value.state && cities.length > 0 ? (
        <Select
          label="Cidade"
          required={requiredCity}
          error={errors?.city}
          value={value.city ?? ''}
          onChange={(e) => handleCityChange(e.target.value)}
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
          onChange={(e) => handleCityChange(e.target.value)}
          hint={loadingCities ? 'Carregando cidades...' : undefined}
        />
      )}

      {/* Bairro / Região */}
      {isPalmas ? (
        <Select
          label="Região"
          error={errors?.neighborhood}
          value={value.neighborhood ?? ''}
          onChange={(e) => handleNeighborhoodChange(e.target.value)}
        >
          <option value="">Selecione a região</option>
          {PALMAS_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
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

      {/* Quadra — Palmas: sempre exibido quando uma região está selecionada */}
      {showPalmasBlock &&
        (showBlockFreeText ? (
          // Modo texto livre (após selecionar "Outro" ou bloco não encontrado na lista)
          <div className="flex flex-col gap-1">
            <Input
              label="Quadra / Localidade"
              placeholder="Digite a quadra ou localidade"
              error={errors?.block}
              value={value.block ?? ''}
              onChange={(e) => onChange('block', e.target.value)}
            />
            <button
              type="button"
              className="text-xs text-brand-600 hover:underline self-start"
              onClick={() => {
                setBlockFreeText(false)
                onChange('block', '')
              }}
            >
              ← Selecionar da lista
            </button>
          </div>
        ) : (
          // Dropdown filtrado pela região
          <Select
            label="Quadra"
            error={errors?.block}
            value={value.block ?? ''}
            onChange={(e) => handleBlockSelectChange(e.target.value)}
          >
            <option value="">Selecione a quadra</option>
            {palmasBlocks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
            <option value={OTHER_BLOCK}>Outro / Não encontrei</option>
          </Select>
        ))}

      {/* Quadra — outras cidades */}
      {!isPalmas && showBlock && (
        <Input
          label="Quadra"
          placeholder="Quadra ou bloco"
          hint="Ex: Quadra 304 Sul"
          error={errors?.block}
          value={value.block ?? ''}
          onChange={(e) => onChange('block', e.target.value)}
        />
      )}

      {/* Campos especiais para Região Rural */}
      {isRural ? (
        <>
          <Input
            label="Estrada / rodovia / acesso"
            placeholder="Ex: TO-050, Estrada do Lajeado"
            error={errors?.street}
            value={value.street ?? ''}
            onChange={(e) => onChange('street', e.target.value)}
          />
          <Input
            label="Nome da propriedade / fazenda"
            placeholder="Ex: Fazenda Boa Vista, Chácara São João"
            error={errors?.block}
            value={value.block ?? ''}
            onChange={(e) => onChange('block', e.target.value)}
          />
          <div className="sm:col-span-2">
            <Input
              label="Referência e observações"
              placeholder="Ex: KM 15, após o posto, porteira azul"
              error={errors?.complement}
              value={value.complement ?? ''}
              onChange={(e) => onChange('complement', e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
