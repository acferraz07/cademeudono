'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, AlertTriangle, UploadCloud } from 'lucide-react'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { announcementsApi, petsApi } from '@/lib/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Card } from '@/components/ui/card'
import { LocationSelector } from '@/components/location/location-selector'
import { cn, cleanPhone } from '@/lib/utils'
import type { Pet } from '@/types'

const schema = z.object({
  type: z.enum(['LOST', 'FOUND']),
  species: z.enum(['DOG', 'CAT', 'OTHER']),
  petName: z.string().optional(),
  breed: z.string().optional(),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'GIANT', '']).optional(),
  specificMarks: z.string().optional(),
  petPhotoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  state: z.string().min(2, 'Estado obrigatório'),
  city: z.string().min(1, 'Cidade obrigatória'),
  neighborhood: z.string().optional(),
  block: z.string().optional(),
  street: z.string().optional(),
  locationNotes: z.string().optional(),
  eventDate: z.string().min(1, 'Data obrigatória'),
  contactPhone: z.string().min(10, 'Telefone obrigatório'),
  contactName: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewAnnouncementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuth()
  const [myPets, setMyPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string>('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const defaultType = (searchParams.get('type') as 'LOST' | 'FOUND') ?? 'LOST'

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType, species: 'DOG' },
  })

  const type = watch('type')
  const locationValue = {
    state: watch('state'),
    city: watch('city'),
    neighborhood: watch('neighborhood'),
    block: watch('block'),
    street: watch('street'),
  }

  useEffect(() => {
    if (!token) return
    petsApi.findAll(token).then(setMyPets).catch(() => {})
  }, [token])

  useEffect(() => {
    if (!selectedPetId) return
    const pet = myPets.find((p) => p.id === selectedPetId)
    if (!pet) return
    setValue('petName', pet.name)
    setValue('species', pet.species)
    if (pet.breed) setValue('breed', pet.breed)
    if (pet.size) setValue('size', pet.size)
    if (pet.specificMarks) setValue('specificMarks', pet.specificMarks)
    if (pet.profilePhotoUrl) {
      setValue('petPhotoUrl', pet.profilePhotoUrl)
      setPhotoPreview(pet.profilePhotoUrl)
    }
  }, [selectedPetId, myPets, setValue])

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setPhotoError('')
    setIsUploading(true)
    setPhotoPreview(URL.createObjectURL(file))
    try {
      const { url } = await announcementsApi.uploadImage(token, file)
      setValue('petPhotoUrl', url, { shouldValidate: true })
    } catch {
      setPhotoError('Erro ao enviar imagem. Tente novamente.')
      setPhotoPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  async function onSubmit(data: FormData) {
    if (!token) return
    try {
      const payload = {
        ...data,
        contactPhone: cleanPhone(data.contactPhone),
        size: data.size || undefined,
        petPhotoUrl: data.petPhotoUrl || undefined,
        petId: selectedPetId || undefined,
      }
      await announcementsApi.create(token, payload)
      router.push('/announcements')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao publicar anúncio'
      setError('root', { message: msg })
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/announcements" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Publicar anúncio</h1>
          <p className="text-sm text-gray-500">Ajude um pet a voltar para casa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Type selection */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Tipo de anúncio</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['LOST', 'FOUND'] as const).map((t) => (
              <label
                key={t}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  type === t
                    ? t === 'LOST'
                      ? 'border-rose-400 bg-rose-50 text-rose-700'
                      : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600',
                )}
              >
                <input type="radio" value={t} className="sr-only" {...register('type')} />
                <span className="text-2xl">{t === 'LOST' ? '😢' : '🙌'}</span>
                <span className="font-semibold text-sm">
                  {t === 'LOST' ? 'Pet Perdido' : 'Pet Encontrado'}
                </span>
                <span className="text-xs text-center opacity-70">
                  {t === 'LOST' ? 'Meu pet desapareceu' : 'Encontrei um pet sem dono'}
                </span>
              </label>
            ))}
          </div>
        </Card>

        {/* Auto-fill from existing pet */}
        {myPets.length > 0 && (
          <Card>
            <h2 className="font-semibold text-gray-900 mb-1">Usar um pet cadastrado</h2>
            <p className="text-xs text-gray-500 mb-3">
              Selecione para preencher automaticamente as informações
            </p>
            <Select value={selectedPetId} onChange={(e) => setSelectedPetId(e.target.value)}>
              <option value="">Selecionar pet (opcional)</option>
              {myPets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.species === 'DOG' ? 'Cão' : p.species === 'CAT' ? 'Gato' : 'Outro'}
                  {p.breed ? ` (${p.breed})` : ''}
                </option>
              ))}
            </Select>
          </Card>
        )}

        {/* Pet info */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🐾</span> Informações do pet
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome do pet"
              placeholder="Rex (se souber)"
              error={errors.petName?.message}
              {...register('petName')}
            />
            <Select label="Espécie" required error={errors.species?.message} {...register('species')}>
              <option value="DOG">🐕 Cão</option>
              <option value="CAT">🐈 Gato</option>
              <option value="OTHER">🐾 Outro</option>
            </Select>
            <Input
              label="Raça"
              placeholder="SRD, Labrador, Vira-lata..."
              error={errors.breed?.message}
              {...register('breed')}
            />
            <Select label="Porte" error={errors.size?.message} {...register('size')}>
              <option value="">Não sei / não informado</option>
              <option value="SMALL">Pequeno</option>
              <option value="MEDIUM">Médio</option>
              <option value="LARGE">Grande</option>
              <option value="GIANT">Gigante</option>
            </Select>
          </div>

          <div className="mt-4">
            <Textarea
              label="Características e marcas específicas"
              placeholder="Pelagem, cor dos olhos, manchas, cicatrizes..."
              error={errors.specificMarks?.message}
              {...register('specificMarks')}
            />
          </div>

          {/* Photo upload */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">Foto do pet</label>
            {photoPreview && (
              <div className="flex justify-center">
                <Image
                  src={photoPreview}
                  alt="Preview do pet"
                  width={128}
                  height={128}
                  className="h-32 w-32 rounded-xl object-cover border-2 border-gray-200"
                  unoptimized
                />
              </div>
            )}
            <label
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                isUploading
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50'
              }`}
            >
              <UploadCloud size={18} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500">
                {isUploading ? 'Enviando...' : photoPreview ? 'Trocar imagem' : 'Selecionar imagem'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
                disabled={isUploading}
              />
            </label>
            {photoError && <p className="text-xs text-rose-600">{photoError}</p>}
            <input type="hidden" {...register('petPhotoUrl')} />
          </div>
        </Card>

        {/* Location */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">📍</span> Localização
          </h2>
          <LocationSelector
            value={locationValue}
            onChange={(field, val) => setValue(field, val)}
            errors={{
              state: errors.state?.message,
              city: errors.city?.message,
              neighborhood: errors.neighborhood?.message,
            }}
            showBlock
            showStreet
            requiredState
            requiredCity
          />
          <div className="mt-4">
            <Textarea
              label="Referência ou observações da localização"
              placeholder="Próximo ao parque, em frente ao mercado..."
              error={errors.locationNotes?.message}
              {...register('locationNotes')}
            />
          </div>
          <div className="mt-4">
            <Input
              label={type === 'LOST' ? 'Data que desapareceu' : 'Data que foi encontrado'}
              type="date"
              required
              error={errors.eventDate?.message}
              {...register('eventDate')}
            />
          </div>
        </Card>

        {/* Contact */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">📞</span> Contato
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PhoneInput
              label="Telefone para contato"
              required
              error={errors.contactPhone?.message}
              {...register('contactPhone')}
            />
            <Input
              label="Nome do contato"
              placeholder="João Silva"
              error={errors.contactName?.message}
              {...register('contactName')}
            />
          </div>
        </Card>

        {errors.root && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="shrink-0" />
            {errors.root.message}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <Link href="/announcements" className={buttonVariants({ variant: 'outline' })}>
            Cancelar
          </Link>
          <Button type="submit" loading={isSubmitting} fullWidth>
            Publicar anúncio
          </Button>
        </div>
      </form>
    </div>
  )
}
