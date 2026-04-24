'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Card } from '@/components/ui/card'
import { BRAZIL_STATES, phoneMask, cleanPhone } from '@/lib/utils'
import { useState } from 'react'

const schema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  phonePrimary: z.string().optional(),
  phoneSecondary: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth()
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!user) return
    reset({
      fullName: user.fullName ?? '',
      phonePrimary: phoneMask(user.phonePrimary ?? ''),
      phoneSecondary: phoneMask(user.phoneSecondary ?? ''),
      state: user.state ?? '',
      city: user.city ?? '',
      neighborhood: user.neighborhood ?? '',
      address: user.address ?? '',
    })
  }, [user, reset])

  async function onSubmit(data: FormData) {
    if (!token) return
    try {
      await usersApi.updateMe(token, {
        ...data,
        phonePrimary: cleanPhone(data.phonePrimary ?? ''),
        phoneSecondary: cleanPhone(data.phoneSecondary ?? ''),
      })
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao salvar perfil'
      setError('root', { message: msg })
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Mantenha suas informações de contato atualizadas</p>
      </div>

      {/* Avatar placeholder */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
          <span className="text-2xl font-bold text-brand-700">
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.fullName}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Personal info */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            Dados pessoais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome completo"
              required
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="E-mail"
              type="email"
              value={user?.email ?? ''}
              disabled
              hint="O e-mail não pode ser alterado"
            />
            <PhoneInput
              label="Telefone principal"
              error={errors.phonePrimary?.message}
              {...register('phonePrimary')}
            />
            <PhoneInput
              label="Telefone secundário"
              error={errors.phoneSecondary?.message}
              {...register('phoneSecondary')}
            />
          </div>
        </Card>

        {/* Address */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Localização</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Estado" error={errors.state?.message} {...register('state')}>
              <option value="">Selecione</option>
              {BRAZIL_STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Input
              label="Cidade"
              placeholder="Palmas"
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="Bairro"
              placeholder="Plano Diretor Sul"
              error={errors.neighborhood?.message}
              {...register('neighborhood')}
            />
            <Input
              label="Endereço"
              placeholder="Alameda 5, Quadra 304 Sul"
              error={errors.address?.message}
              {...register('address')}
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
            Perfil atualizado com sucesso!
          </div>
        )}

        <div className="pb-8">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
