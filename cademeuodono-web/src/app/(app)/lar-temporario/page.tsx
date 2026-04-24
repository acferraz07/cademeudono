'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { fosterApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Card } from '@/components/ui/card'
import { LocationSelector } from '@/components/location/location-selector'
import { cleanPhone } from '@/lib/utils'
import type { FosterVolunteer } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().min(10, 'Telefone obrigatório'),
  state: z.string().min(2, 'Estado obrigatório'),
  city: z.string().min(1, 'Cidade obrigatória'),
  neighborhood: z.string().optional(),
  housingType: z.enum(['house', 'apartment']),
  hasOtherPets: z.boolean(),
  acceptsDogs: z.boolean(),
  acceptsCats: z.boolean(),
  acceptedSizes: z.array(z.string()).min(1, 'Selecione ao menos um porte'),
  maxPets: z.number().min(1).max(20),
  availability: z.enum(['immediate', 'occasional']),
  experience: z.string().optional(),
  observations: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const SIZES = [
  { value: 'SMALL', label: 'Pequeno' },
  { value: 'MEDIUM', label: 'Médio' },
  { value: 'LARGE', label: 'Grande' },
  { value: 'GIANT', label: 'Gigante' },
]

export default function LarTemporarioPage() {
  const { token, user } = useAuth()
  const [existing, setExisting] = useState<FosterVolunteer | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.fullName ?? '',
      hasOtherPets: false,
      acceptsDogs: true,
      acceptsCats: true,
      acceptedSizes: [],
      maxPets: 1,
      housingType: 'house',
      availability: 'immediate',
    },
  })

  const locationValue = {
    state: watch('state'),
    city: watch('city'),
    neighborhood: watch('neighborhood'),
  }

  useEffect(() => {
    if (!token) return
    fosterApi.findMine(token)
      .then((v) => {
        setExisting(v)
        reset({
          name: v.name,
          phone: v.phone,
          state: v.state,
          city: v.city,
          neighborhood: v.neighborhood ?? '',
          housingType: v.housingType,
          hasOtherPets: v.hasOtherPets,
          acceptsDogs: v.acceptsDogs,
          acceptsCats: v.acceptsCats,
          acceptedSizes: v.acceptedSizes,
          maxPets: v.maxPets,
          availability: v.availability,
          experience: v.experience ?? '',
          observations: v.observations ?? '',
        })
      })
      .catch(() => {})
  }, [token, reset])

  async function onSubmit(data: FormData) {
    if (!token) return
    try {
      await fosterApi.register(token, {
        ...data,
        phone: cleanPhone(data.phone),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao salvar cadastro'
      setError('root', { message: msg })
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏠 Lar temporário</h1>
        <p className="text-sm text-gray-500 mt-1">
          Seja um voluntário e ajude pets em situações de urgência
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 text-sm text-amber-700">
        <p className="font-medium mb-1">Sobre o lar temporário</p>
        <p>
          Voluntários de lar temporário acolhem pets enquanto aguardam adoção permanente ou retorno
          ao tutor. Seus dados são armazenados com segurança e não são exibidos publicamente.
        </p>
      </div>

      {existing && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 size={16} />
          Você já está cadastrado como voluntário. Atualize seus dados abaixo.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Dados pessoais */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Dados pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome completo"
              required
              error={errors.name?.message}
              {...register('name')}
            />
            <PhoneInput
              label="Telefone (WhatsApp)"
              required
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>
        </Card>

        {/* Localização */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Localização</h2>
          <LocationSelector
            value={locationValue}
            onChange={(field, val) => setValue(field as any, val)}
            errors={{
              state: errors.state?.message,
              city: errors.city?.message,
              neighborhood: errors.neighborhood?.message,
            }}
            requiredState
            requiredCity
          />
        </Card>

        {/* Moradia */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Moradia e disponibilidade</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipo de moradia"
              required
              error={errors.housingType?.message}
              {...register('housingType')}
            >
              <option value="house">Casa</option>
              <option value="apartment">Apartamento</option>
            </Select>
            <Select
              label="Disponibilidade"
              required
              error={errors.availability?.message}
              {...register('availability')}
            >
              <option value="immediate">Imediata</option>
              <option value="occasional">Eventual</option>
            </Select>
            <Input
              label="Quantidade máxima de pets"
              type="number"
              required
              error={errors.maxPets?.message}
              {...register('maxPets', { valueAsNumber: true })}
            />
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register('hasOtherPets')}
                />
                <span className="text-sm text-gray-700">Possui outros animais</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register('acceptsDogs')}
                />
                <span className="text-sm text-gray-700">Aceita cães</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register('acceptsCats')}
                />
                <span className="text-sm text-gray-700">Aceita gatos</span>
              </label>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Porte aceito</p>
              {errors.acceptedSizes && (
                <p className="text-xs text-rose-600 mb-1">{errors.acceptedSizes.message}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {SIZES.map((s) => (
                  <label key={s.value} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      value={s.value}
                      className="h-4 w-4 rounded border-gray-300"
                      {...register('acceptedSizes')}
                    />
                    <span className="text-sm text-gray-700">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Experiência */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Experiência e observações</h2>
          <div className="space-y-4">
            <Textarea
              label="Experiência com animais"
              placeholder="Descreva sua experiência com pets..."
              error={errors.experience?.message}
              {...register('experience')}
            />
            <Textarea
              label="Observações adicionais"
              placeholder="Alguma restrição ou informação importante..."
              error={errors.observations?.message}
              {...register('observations')}
            />
          </div>
        </Card>

        {errors.root && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="shrink-0" />
            {errors.root.message}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} className="shrink-0" />
            Cadastro salvo com sucesso!
          </div>
        )}

        <div className="pb-8">
          <Button type="submit" loading={isSubmitting} fullWidth>
            {existing ? 'Atualizar cadastro' : 'Cadastrar como voluntário'}
          </Button>
        </div>
      </form>
    </div>
  )
}
