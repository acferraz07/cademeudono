'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, UploadCloud, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { petsApi } from '@/lib/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Card } from '@/components/ui/card'
import { BreedSelector } from '@/components/breeds/breed-selector'
import { PET_BEHAVIORS, PET_BEHAVIOR_LABEL } from '@/types'
import { cleanPhone } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(50),
  species: z.enum(['DOG', 'CAT', 'OTHER']),
  breedId: z.string().optional(),
  breed: z.string().optional(),
  birthDate: z.string().optional(),
  sex: z.enum(['MALE', 'FEMALE', '']).optional(),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'GIANT', '']).optional(),
  isCastrated: z.boolean().optional(),
  coatColor: z.string().optional(),
  coatType: z.string().optional(),
  eyeColor: z.string().optional(),
  specificMarks: z.string().optional(),
  behavior: z.array(z.string()).optional(),
  isUrgent: z.boolean().optional(),
  secretMark: z.string().optional(),
  profilePhotoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  ageEstimate: z.string().optional(),
  // Health
  vetName: z.string().optional(),
  vetPhone: z.string().optional(),
  vetClinic: z.string().optional(),
  petShop: z.string().optional(),
  vaccinationStatus: z.string().optional(),
  dewormingStatus: z.string().optional(),
  continuousMedications: z.string().optional(),
  allergies: z.string().optional(),
  specialCare: z.string().optional(),
  generalObservations: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const hasHealthData = (d: FormData) =>
  d.vetName || d.vetPhone || d.vetClinic || d.petShop ||
  d.vaccinationStatus || d.dewormingStatus || d.continuousMedications ||
  d.allergies || d.specialCare || d.generalObservations

export default function NewPetPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { species: 'DOG' },
  })

  const currentSpecies = watch('species')
  const currentBreedId = watch('breedId')
  const currentBreed = watch('breed')

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setPhotoError('')
    setIsUploading(true)
    setPhotoPreview(URL.createObjectURL(file))
    try {
      const { url } = await petsApi.uploadImage(token, file)
      setValue('profilePhotoUrl', url, { shouldValidate: true })
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
      const pet = await petsApi.create(token, {
        ...data,
        sex: data.sex || undefined,
        size: data.size || undefined,
        profilePhotoUrl: data.profilePhotoUrl || undefined,
        breedId: data.species !== 'OTHER' ? (data.breedId || undefined) : undefined,
        breed: data.species === 'OTHER' ? (data.breed || undefined) : undefined,
        coatColor: data.coatColor
          ? data.coatColor.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      })

      if (hasHealthData(data)) {
        await petsApi.upsertHealth(token, pet.id, {
          vetName: data.vetName || undefined,
          vetPhone: data.vetPhone ? cleanPhone(data.vetPhone) : undefined,
          vetClinic: data.vetClinic || undefined,
          petShop: data.petShop || undefined,
          vaccinationStatus: data.vaccinationStatus || undefined,
          dewormingStatus: data.dewormingStatus || undefined,
          continuousMedications: data.continuousMedications || undefined,
          allergies: data.allergies || undefined,
          specialCare: data.specialCare || undefined,
          generalObservations: data.generalObservations || undefined,
        })
      }

      router.push('/pets')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao salvar o pet'
      setError('root', { message: msg })
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pets" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cadastrar novo pet</h1>
          <p className="text-sm text-gray-500">Preencha as informações do seu pet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Identidade */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🐾</span> Identidade
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome do pet"
              placeholder="Rex"
              required
              error={errors.name?.message}
              {...register('name')}
            />
            <Select
              label="Espécie"
              required
              error={errors.species?.message}
              {...register('species', {
                onChange: () => {
                  setValue('breedId', '')
                  setValue('breed', '')
                },
              })}
            >
              <option value="DOG">🐕 Cão</option>
              <option value="CAT">🐈 Gato</option>
              <option value="OTHER">🐾 Outro</option>
            </Select>
            <BreedSelector
              species={currentSpecies}
              breedId={currentBreedId}
              breed={currentBreed}
              onBreedIdChange={(id) => setValue('breedId', id)}
              onBreedChange={(text) => setValue('breed', text)}
              error={errors.breedId?.message ?? errors.breed?.message}
            />
            <Input
              label="Data de nascimento"
              type="date"
              error={errors.birthDate?.message}
              {...register('birthDate')}
            />
            <Input
              label="Idade aproximada"
              placeholder="Ex: 2 anos, 8 meses"
              hint="Preencha se não souber a data de nascimento"
              error={errors.ageEstimate?.message}
              {...register('ageEstimate')}
            />
          </div>
        </Card>

        {/* Aparência */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🎨</span> Aparência
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Sexo" error={errors.sex?.message} {...register('sex')}>
              <option value="">Não informado</option>
              <option value="MALE">Macho</option>
              <option value="FEMALE">Fêmea</option>
            </Select>
            <Select label="Porte" error={errors.size?.message} {...register('size')}>
              <option value="">Não informado</option>
              <option value="SMALL">Pequeno (até 10kg)</option>
              <option value="MEDIUM">Médio (10–25kg)</option>
              <option value="LARGE">Grande (25–45kg)</option>
              <option value="GIANT">Gigante (acima de 45kg)</option>
            </Select>
            <Input
              label="Cor da pelagem"
              placeholder="Caramelo, preto e branco..."
              hint="Separe as cores por vírgula"
              error={errors.coatColor?.message}
              {...register('coatColor')}
            />
            <Input
              label="Tipo de pelagem"
              placeholder="Curto, longo, crespo..."
              error={errors.coatType?.message}
              {...register('coatType')}
            />
            <Input
              label="Cor dos olhos"
              placeholder="Castanho, verde, azul..."
              error={errors.eyeColor?.message}
              {...register('eyeColor')}
            />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  {...register('isCastrated')}
                />
                <span className="text-sm font-medium text-gray-700">Castrado(a)</span>
              </label>
            </div>
          </div>
          <div className="mt-4">
            <Textarea
              label="Marcas e características específicas"
              placeholder="Ex: Mancha preta na pata esquerda, cicatriz no focinho..."
              error={errors.specificMarks?.message}
              {...register('specificMarks')}
            />
          </div>
        </Card>

        {/* Temperamento */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">💭</span> Temperamento
          </h2>
          <p className="text-xs text-gray-500 mb-3">Selecione todos que se aplicam</p>
          <div className="flex flex-wrap gap-3">
            {PET_BEHAVIORS.map((b) => (
              <label key={b} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  value={b}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  {...register('behavior')}
                />
                <span className="text-sm text-gray-700">{PET_BEHAVIOR_LABEL[b]}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                {...register('isUrgent')}
              />
              <span className="text-sm font-medium text-gray-700">
                ⚠️ Precisa de atenção urgente
              </span>
            </label>
          </div>
        </Card>

        {/* Foto */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">📸</span> Foto do pet
          </h2>
          <div className="space-y-4">
            {photoPreview && (
              <div className="flex justify-center">
                <Image
                  src={photoPreview}
                  alt="Preview do pet"
                  width={128}
                  height={128}
                  className="h-32 w-32 rounded-full object-cover border-2 border-gray-200"
                  unoptimized
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Foto do pet</label>
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
            </div>
            <input type="hidden" {...register('profilePhotoUrl')} />
          </div>
        </Card>

        {/* Informações do veterinário */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🏥</span> Veterinário e saúde
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome do veterinário"
              placeholder="Dr. Roberto Alves"
              error={errors.vetName?.message}
              {...register('vetName')}
            />
            <PhoneInput
              label="Telefone do veterinário"
              error={errors.vetPhone?.message}
              {...register('vetPhone')}
            />
            <Input
              label="Clínica veterinária"
              placeholder="VetPalmas"
              error={errors.vetClinic?.message}
              {...register('vetClinic')}
            />
            <Input
              label="Pet shop"
              placeholder="PetShop Amigo Fiel"
              error={errors.petShop?.message}
              {...register('petShop')}
            />
            <Select
              label="Vacinação"
              error={errors.vaccinationStatus?.message}
              {...register('vaccinationStatus')}
            >
              <option value="">Não informado</option>
              <option value="up_to_date">Em dia</option>
              <option value="outdated">Atrasada</option>
              <option value="unknown">Desconhecido</option>
            </Select>
            <Select
              label="Vermifugação"
              error={errors.dewormingStatus?.message}
              {...register('dewormingStatus')}
            >
              <option value="">Não informado</option>
              <option value="up_to_date">Em dia</option>
              <option value="outdated">Atrasada</option>
              <option value="unknown">Desconhecido</option>
            </Select>
          </div>
          <div className="mt-4 space-y-4">
            <Input
              label="Medicações contínuas"
              placeholder="Enalapril 2,5mg — 1x ao dia"
              error={errors.continuousMedications?.message}
              {...register('continuousMedications')}
            />
            <Input
              label="Alergias"
              placeholder="Frango, anti-inflamatórios..."
              error={errors.allergies?.message}
              {...register('allergies')}
            />
            <Textarea
              label="Cuidados especiais"
              placeholder="Evitar esforço intenso, dieta específica..."
              error={errors.specialCare?.message}
              {...register('specialCare')}
            />
          </div>
        </Card>

        {/* Marca secreta */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <span className="text-lg">🔒</span> Marca secreta
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Visível apenas para você. Ajuda a confirmar que o pet encontrado é o seu.
          </p>
          <Textarea
            label="Marca secreta"
            placeholder="Pinta rosa na barriga, formato de coração..."
            error={errors.secretMark?.message}
            {...register('secretMark')}
          />
        </Card>

        {errors.root && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="shrink-0" />
            {errors.root.message}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <Link href="/pets" className={buttonVariants({ variant: 'outline' })}>
            Cancelar
          </Link>
          <Button type="submit" loading={isSubmitting} fullWidth>
            Salvar pet
          </Button>
        </div>
      </form>
    </div>
  )
}
