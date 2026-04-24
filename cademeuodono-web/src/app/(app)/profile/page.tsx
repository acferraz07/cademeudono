'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, AlertTriangle, CheckCircle2, Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Card } from '@/components/ui/card'
import { LocationSelector } from '@/components/location/location-selector'
import { phoneMask, cleanPhone } from '@/lib/utils'

const schema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  phonePrimary: z.string().optional(),
  phoneSecondary: z.string().optional(),
  whatsapp: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  block: z.string().optional(),
  lotNumber: z.string().optional(),
  address: z.string().optional(),
  streetNumber: z.string().optional(),
  complement: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth()
  const [saved, setSaved] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!user) return
    reset({
      fullName: user.fullName ?? '',
      phonePrimary: phoneMask(user.phonePrimary ?? ''),
      phoneSecondary: phoneMask(user.phoneSecondary ?? ''),
      whatsapp: phoneMask(user.whatsapp ?? ''),
      state: user.state ?? '',
      city: user.city ?? '',
      neighborhood: user.neighborhood ?? '',
      block: user.block ?? '',
      lotNumber: user.lotNumber ?? '',
      address: user.address ?? '',
      streetNumber: user.streetNumber ?? '',
      complement: user.complement ?? '',
    })
  }, [user, reset])

  const locationValue = {
    state: watch('state'),
    city: watch('city'),
    neighborhood: watch('neighborhood'),
    block: watch('block'),
    lotNumber: watch('lotNumber'),
    street: watch('address'),
    streetNumber: watch('streetNumber'),
    complement: watch('complement'),
  }

  function handleLocationChange(field: keyof typeof locationValue, val: string) {
    if (field === 'street') {
      setValue('address', val, { shouldDirty: true })
    } else if (field === 'state' || field === 'city' || field === 'neighborhood' || field === 'block' || field === 'lotNumber' || field === 'streetNumber' || field === 'complement') {
      setValue(field as keyof FormData, val, { shouldDirty: true })
    }
  }

  async function onSubmit(data: FormData) {
    if (!token) return
    try {
      await usersApi.updateMe(token, {
        ...data,
        phonePrimary: cleanPhone(data.phonePrimary ?? ''),
        phoneSecondary: cleanPhone(data.phoneSecondary ?? ''),
        whatsapp: cleanPhone(data.whatsapp ?? ''),
      })
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao salvar perfil'
      setError('root', { message: msg })
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !token) return

    setAvatarError('')
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
    setAvatarLoading(true)

    try {
      await usersApi.uploadAvatar(token, file)
      await refreshUser()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao enviar foto'
      setAvatarError(msg)
      setAvatarPreview(null)
    } finally {
      setAvatarLoading(false)
    }
  }

  const displayAvatar = avatarPreview ?? user?.avatarUrl ?? null
  const initials = user?.fullName?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Mantenha suas informações de contato atualizadas</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center overflow-hidden">
            {displayAvatar ? (
              <Image src={displayAvatar} alt="Foto de perfil" width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              <span className="text-2xl font-bold text-brand-700">{initials}</span>
            )}
            {avatarLoading && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarLoading}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow hover:bg-brand-700 transition-colors disabled:opacity-50"
            title="Alterar foto"
          >
            <Camera size={12} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.fullName}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          {avatarLoading && <p className="text-xs text-brand-600 mt-0.5">Enviando...</p>}
          {avatarError && <p className="text-xs text-rose-600 mt-0.5">{avatarError}</p>}
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
            <PhoneInput
              label="WhatsApp"
              hint="Usado como contato preferencial nos botões de contato"
              error={errors.whatsapp?.message}
              {...register('whatsapp')}
            />
          </div>
        </Card>

        {/* Address */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Endereço</h2>
          <LocationSelector
            value={locationValue}
            onChange={handleLocationChange}
            errors={{
              state: errors.state?.message,
              city: errors.city?.message,
              neighborhood: errors.neighborhood?.message,
              block: errors.block?.message,
              lotNumber: errors.lotNumber?.message,
              street: errors.address?.message,
              streetNumber: errors.streetNumber?.message,
              complement: errors.complement?.message,
            }}
            showBlock
            showLotNumber
            showStreet
            showStreetNumber
            showComplement
          />
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
