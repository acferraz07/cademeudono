'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, AlertTriangle, UploadCloud, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { petsApi } from '@/lib/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { BreedSelector } from '@/components/breeds/breed-selector'
import { PET_BEHAVIORS, PET_BEHAVIOR_LABEL } from '@/types'
import { cleanPhone, phoneMask } from '@/lib/utils'
import type { Pet } from '@/types'

type PetStatusKey = 'none' | 'lost' | 'found' | 'returned' | 'for_adoption' | 'adopted' | 'petmatch'

const STATUS_OPTIONS: { value: PetStatusKey; label: string }[] = [
  { value: 'none',         label: '— Nenhum status especial' },
  { value: 'lost',         label: '🚨 Esse pet está perdido' },
  { value: 'found',        label: '📢 Esse pet foi encontrado (procura-se tutor)' },
  { value: 'returned',     label: '🌟 Esse pet foi devolvido ao tutor' },
  { value: 'for_adoption', label: '🏡 Esse pet está disponível para adoção responsável' },
  { value: 'adopted',      label: '❤️ Esse pet teve a adoção realizada' },
  { value: 'petmatch',     label: '💘 Esse pet está disponível no PetMatch' },
]

function derivePetStatus(p: Pet): PetStatusKey {
  if (p.isReturned) return 'returned'
  if (p.isAdopted) return 'adopted'
  if (p.isLost) return 'lost'
  if (p.isFound) return 'found'
  if (p.isForAdoption) return 'for_adoption'
  if (p.isForPetMatch) return 'petmatch'
  return 'none'
}

function statusToBooleans(status: PetStatusKey) {
  return {
    isLost:        status === 'lost',
    isFound:       status === 'found',
    isReturned:    status === 'returned',
    isForAdoption: status === 'for_adoption',
    isAdopted:     status === 'adopted',
    isForPetMatch: status === 'petmatch',
  }
}

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
  secretMark: z.string().optional(),
  profilePhotoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  ageEstimate: z.string().optional(),
  // Status
  petStatus: z.enum(['none', 'lost', 'found', 'returned', 'for_adoption', 'adopted', 'petmatch']),
  isUrgentFoster: z.boolean().optional(),
  // Detalhes de status
  lastSeenLocation: z.string().optional(),
  lostNotes: z.string().optional(),
  adoptionStory: z.string().optional(),
  adoptionReason: z.string().optional(),
  adoptionRequirements: z.string().optional(),
  isInFosterHome: z.boolean().optional(),
  adoptionUrgency: z.string().optional(),
  isOng: z.boolean().optional(),
  ongName: z.string().optional(),
  petMatchObjective: z.string().optional(),
  petMatchPreferences: z.string().optional(),
  acceptsCrossbreeding: z.boolean().optional(),
  petMatchObservations: z.string().optional(),
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

export default function EditPetPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { token } = useAuth()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loadError, setLoadError] = useState('')
  const [adoptedSuccess, setAdoptedSuccess] = useState(false)
  const [adoptLoading, setAdoptLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const currentSpecies = watch('species')
  const currentBreedId = watch('breedId')
  const currentBreed = watch('breed')
  const currentStatus = watch('petStatus')
  const isUrgentFoster = watch('isUrgentFoster')

  const showUrgentFoster = currentStatus === 'found' || currentStatus === 'for_adoption'
  const showLostFields = currentStatus === 'lost'
  const showAdoptionFields = currentStatus === 'for_adoption' || currentStatus === 'adopted'
  const showPetMatchFields = currentStatus === 'petmatch'

  useEffect(() => {
    if (!token || !params.id) return
    petsApi
      .findOne(token, params.id)
      .then((p) => {
        setPet(p)
        reset({
          name: p.name,
          species: p.species,
          breedId: p.breedId ?? '',
          breed: p.breed ?? '',
          birthDate: p.birthDate ? p.birthDate.split('T')[0] : '',
          sex: p.sex ?? '',
          size: p.size ?? '',
          isCastrated: p.isCastrated ?? false,
          coatColor: p.coatColor?.join(', ') ?? '',
          coatType: p.coatType ?? '',
          eyeColor: p.eyeColor ?? '',
          specificMarks: p.specificMarks ?? '',
          behavior: p.behavior ?? [],
          secretMark: p.secretMark ?? '',
          profilePhotoUrl: p.profilePhotoUrl ?? '',
          ageEstimate: p.ageEstimate ?? '',
          petStatus: derivePetStatus(p),
          isUrgentFoster: p.isUrgentFoster ?? false,
          lastSeenLocation: p.lastSeenLocation ?? '',
          lostNotes: p.lostNotes ?? '',
          adoptionStory: p.adoptionStory ?? '',
          adoptionReason: p.adoptionReason ?? '',
          adoptionRequirements: p.adoptionRequirements ?? '',
          isInFosterHome: p.isInFosterHome ?? false,
          adoptionUrgency: p.adoptionUrgency ?? 'normal',
          isOng: p.isOng ?? false,
          ongName: p.ongName ?? '',
          petMatchObjective: p.petMatchObjective ?? '',
          petMatchPreferences: p.petMatchPreferences ?? '',
          acceptsCrossbreeding: p.acceptsCrossbreeding ?? false,
          petMatchObservations: p.petMatchObservations ?? '',
          vetName: p.health?.vetName ?? '',
          vetPhone: phoneMask(p.health?.vetPhone ?? ''),
          vetClinic: p.health?.vetClinic ?? '',
          petShop: p.health?.petShop ?? '',
          vaccinationStatus: p.health?.vaccinationStatus ?? '',
          dewormingStatus: p.health?.dewormingStatus ?? '',
          continuousMedications: p.health?.continuousMedications ?? '',
          allergies: p.health?.allergies ?? '',
          specialCare: p.health?.specialCare ?? '',
          generalObservations: p.health?.generalObservations ?? '',
        })
        if (p.profilePhotoUrl) setPhotoPreview(p.profilePhotoUrl)
      })
      .catch(() => setLoadError('Pet não encontrado'))
  }, [token, params.id, reset])

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
    if (!token || !params.id) return
    try {
      const booleans = statusToBooleans(data.petStatus)

      await petsApi.update(token, params.id, {
        name: data.name,
        species: data.species,
        breedId: data.species !== 'OTHER' ? (data.breedId || undefined) : undefined,
        breed: data.species === 'OTHER' ? (data.breed || undefined) : undefined,
        birthDate: data.birthDate || undefined,
        sex: data.sex || undefined,
        size: data.size || undefined,
        isCastrated: data.isCastrated,
        coatColor: data.coatColor
          ? data.coatColor.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        coatType: data.coatType || undefined,
        eyeColor: data.eyeColor || undefined,
        specificMarks: data.specificMarks || undefined,
        behavior: data.behavior,
        secretMark: data.secretMark || undefined,
        profilePhotoUrl: data.profilePhotoUrl || undefined,
        ageEstimate: data.ageEstimate || undefined,
        // Status booleans derivados do petStatus selecionado
        ...booleans,
        // isUrgentFoster só válido em found ou for_adoption
        isUrgentFoster: showUrgentFoster ? (data.isUrgentFoster ?? false) : false,
        // Detalhes por status
        lastSeenLocation: data.lastSeenLocation || undefined,
        lostNotes: data.lostNotes || undefined,
        adoptionStory: data.adoptionStory || undefined,
        adoptionReason: data.adoptionReason || undefined,
        adoptionRequirements: data.adoptionRequirements || undefined,
        isInFosterHome: data.isInFosterHome,
        adoptionUrgency: data.adoptionUrgency || 'normal',
        isOng: data.isOng,
        ongName: data.ongName || undefined,
        petMatchObjective: data.petMatchObjective || undefined,
        petMatchPreferences: data.petMatchPreferences || undefined,
        acceptsCrossbreeding: data.acceptsCrossbreeding,
        petMatchObservations: data.petMatchObservations || undefined,
      })

      await petsApi.upsertHealth(token, params.id, {
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

      router.push('/pets')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao salvar o pet'
      setError('root', { message: msg })
    }
  }

  async function handleMarkAdopted() {
    if (!token || !params.id) return
    if (!confirm(`Marcar ${pet?.name} como adotado? Isso remove o pet das listagens de adoção.`)) return
    setAdoptLoading(true)
    try {
      await petsApi.markAdopted(token, params.id)
      setAdoptedSuccess(true)
      setTimeout(() => router.push('/pets'), 2000)
    } catch {
      alert('Erro ao marcar como adotado')
    } finally {
      setAdoptLoading(false)
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-rose-600 font-medium">{loadError}</p>
        <Link href="/pets" className="mt-4 text-sm text-brand-600 hover:underline">
          Voltar para meus pets
        </Link>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pets" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Editar {pet.name}</h1>
          <p className="text-sm text-gray-500">Atualize as informações do pet</p>
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
              placeholder="Ex: Mancha preta na pata esquerda..."
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
        </Card>

        {/* ── Status do pet ── */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <span className="text-lg">📋</span> Status do pet
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Selecione o status atual do seu pet. Anúncios são criados automaticamente.
          </p>

          <div className="space-y-2">
            {STATUS_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  value={opt.value}
                  className="h-4 w-4 border-gray-300 text-brand-500 focus:ring-brand-500"
                  {...register('petStatus')}
                />
                <span className="text-sm text-gray-800">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Complemento de urgência — apenas em "encontrado" ou "adoção disponível" */}
          {showUrgentFoster && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl bg-orange-50 border border-orange-100">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                  {...register('isUrgentFoster')}
                />
                <span className="text-sm font-medium text-orange-800">
                  ⚠️ Urgente: em busca de lar temporário
                </span>
              </label>
            </div>
          )}

          {/* Detalhes de "perdido" */}
          {showLostFields && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <Input
                label="Último local visto"
                placeholder="Praça central do bairro..."
                error={errors.lastSeenLocation?.message}
                {...register('lastSeenLocation')}
              />
              <Textarea
                label="Observações sobre o desaparecimento"
                placeholder="Fugiu pelo portão, estava sem coleira..."
                error={errors.lostNotes?.message}
                {...register('lostNotes')}
              />
            </div>
          )}

          {/* Detalhes de "adoção" */}
          {showAdoptionFields && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <Textarea
                label="História do pet"
                placeholder="Conte a história do pet, personalidade, hábitos..."
                error={errors.adoptionStory?.message}
                {...register('adoptionStory')}
              />
              <Textarea
                label="Motivo da adoção"
                placeholder="Por que o pet está sendo disponibilizado..."
                error={errors.adoptionReason?.message}
                {...register('adoptionReason')}
              />
              <Textarea
                label="Requisitos para o adotante"
                placeholder="Ter espaço, não ter outros animais, etc..."
                error={errors.adoptionRequirements?.message}
                {...register('adoptionRequirements')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Nível de urgência" {...register('adoptionUrgency')}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgente</option>
                </Select>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register('isInFosterHome')} />
                  <span className="text-sm text-gray-700">Está em lar temporário</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register('isOng')} />
                  <span className="text-sm text-gray-700">Pertence a ONG</span>
                </label>
              </div>
              <Input
                label="Nome da ONG"
                placeholder="Nome da organização"
                error={errors.ongName?.message}
                {...register('ongName')}
              />
              {pet?.isForAdoption && !pet?.isAdopted && (
                <div className="pt-2 border-t border-gray-100">
                  {adoptedSuccess ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
                      <CheckCircle2 size={16} />
                      Adoção registrada! Redirecionando...
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleMarkAdopted}
                      loading={adoptLoading}
                    >
                      ✅ Marcar como adotado
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Detalhes de "PetMatch" */}
          {showPetMatchFields && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <Textarea
                label="Objetivo"
                placeholder="O que você busca para o seu pet..."
                error={errors.petMatchObjective?.message}
                {...register('petMatchObjective')}
              />
              <Textarea
                label="Preferências"
                placeholder="Preferência de raça, porte, temperamento..."
                error={errors.petMatchPreferences?.message}
                {...register('petMatchPreferences')}
              />
              <Textarea
                label="Observações"
                placeholder="Informações relevantes para o PetMatch..."
                error={errors.petMatchObservations?.message}
                {...register('petMatchObservations')}
              />
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register('acceptsCrossbreeding')} />
                <span className="text-sm text-gray-700">Aceita cruzamento</span>
              </label>
            </div>
          )}
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
                  className="h-32 w-32 rounded-xl object-cover border-2 border-gray-200"
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

        {/* Veterinário e saúde */}
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
            <Select label="Vacinação" error={errors.vaccinationStatus?.message} {...register('vaccinationStatus')}>
              <option value="">Não informado</option>
              <option value="up_to_date">Em dia</option>
              <option value="outdated">Atrasada</option>
              <option value="unknown">Desconhecido</option>
            </Select>
            <Select label="Vermifugação" error={errors.dewormingStatus?.message} {...register('dewormingStatus')}>
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
            <Textarea
              label="Observações gerais"
              placeholder="Observações gerais sobre a saúde do pet..."
              error={errors.generalObservations?.message}
              {...register('generalObservations')}
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
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
