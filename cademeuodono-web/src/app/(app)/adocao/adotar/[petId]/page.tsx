'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, AlertTriangle, CheckCircle2, FileText, Download } from 'lucide-react'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { petsApi, adoptionApi } from '@/lib/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { SPECIES_LABEL, SIZE_LABEL } from '@/lib/utils'
import type { Pet } from '@/types'

function validateCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

function cpfMask(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

const schema = z.object({
  fullName: z.string().min(5, 'Nome completo obrigatório').max(150),
  cpf: z.string().refine((v) => validateCpf(v), 'CPF inválido'),
  acceptedTerm: z.boolean().refine((v) => v, 'Você deve aceitar o termo para continuar'),
})

type FormData = z.infer<typeof schema>

const ADOPTION_TERM = `TERMO DE ADOÇÃO RESPONSÁVEL — CADÊ MEU DONO

Ao realizar a adoção deste animal, o adotante se compromete a:

1. Oferecer abrigo, alimentação adequada, água fresca e cuidados veterinários necessários ao animal adotado.

2. Não abandonar, revender, utilizar para trabalho forçado, testes ou qualquer forma de exploração o animal.

3. Não maltrator ou negligenciar o animal, comprometendo-se a tratá-lo com respeito e dignidade.

4. Manter as vacinas e vermifugações em dia, bem como providenciar tratamentos médicos quando necessário.

5. Notificar a plataforma Cadê Meu Dono caso não possa mais cuidar do animal, viabilizando novo processo de adoção responsável.

6. Compreender que a omissão de informações ou descumprimento deste termo pode resultar em responsabilização civil e criminal, conforme a Lei Federal nº 9.605/98 (Lei de Crimes Ambientais) e o Decreto Federal nº 24.645/34.

O adotante declara que está ciente e de acordo com as condições acima estabelecidas.`

export default function AdotarPage() {
  const params = useParams<{ petId: string }>()
  const router = useRouter()
  const { token, user } = useAuth()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loadError, setLoadError] = useState('')
  const [adoptionDone, setAdoptionDone] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: user?.fullName ?? '' },
  })

  const cpfValue = watch('cpf') ?? ''

  useEffect(() => {
    if (!token || !params.petId) return
    petsApi
      .findOne(token, params.petId)
      .then(setPet)
      .catch(() => setLoadError('Pet não encontrado'))
  }, [token, params.petId])

  async function onSubmit(data: FormData) {
    if (!token) return
    try {
      const adoption = await adoptionApi.create(token, {
        petId: params.petId,
        fullName: data.fullName,
        cpf: data.cpf,
        acceptedTerm: data.acceptedTerm,
      })
      setAdoptionDone(true)
      if (adoption.pdfUrl) setPdfUrl(adoption.pdfUrl)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao registrar adoção'
      setError('root', { message: msg })
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-rose-600 font-medium">{loadError}</p>
        <Link href="/adocao" className="mt-4 text-sm text-brand-600 hover:underline">Voltar</Link>
      </div>
    )
  }

  if (!pet) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  const photo = pet.profilePhotoUrl ?? pet.media?.[0]?.url
  const breedDisplay = pet.breedName ?? pet.breed

  if (adoptionDone) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Adoção registrada!</h1>
          <p className="text-sm text-gray-500 mb-6">
            O termo de adoção de <strong>{pet.name}</strong> foi registrado com sucesso.
            Guarde o PDF para seus registros.
          </p>
          <div className="flex flex-col gap-3">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors"
              >
                <Download size={16} />
                Baixar termo de adoção (PDF)
              </a>
            )}
            <Link
              href="/adocao/minhas"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-colors text-sm"
            >
              Ver minhas adoções
            </Link>
            <Link href="/adocao" className={buttonVariants({ variant: 'outline' })}>
              Voltar à adoção
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/adocao" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Formulário de adoção</h1>
          <p className="text-sm text-gray-500">Preencha seus dados e aceite o termo responsável</p>
        </div>
      </div>

      {/* Pet info */}
      <Card className="mb-5">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-brand-50 shrink-0">
            {photo ? (
              <Image src={photo} alt={pet.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {pet.species === 'DOG' ? '🐕' : pet.species === 'CAT' ? '🐈' : '🐾'}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{pet.name}</h2>
            <p className="text-sm text-gray-500">
              {SPECIES_LABEL[pet.species]}
              {breedDisplay ? ` · ${breedDisplay}` : ''}
              {pet.size ? ` · ${SIZE_LABEL[pet.size]}` : ''}
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Dados do adotante */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">👤</span> Dados do adotante
          </h2>
          <div className="space-y-4">
            <Input
              label="Nome completo"
              placeholder="João da Silva Santos"
              required
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="CPF"
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
              required
              error={errors.cpf?.message}
              value={cpfMask(cpfValue)}
              onChange={(e) => setValue('cpf', cpfMask(e.target.value), { shouldValidate: true })}
            />
          </div>
        </Card>

        {/* Termo de adoção */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-gray-400" />
            Termo de adoção responsável
          </h2>
          <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-48 overflow-y-auto">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
              {ADOPTION_TERM}
            </pre>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 shrink-0"
              {...register('acceptedTerm')}
            />
            <span className="text-sm text-gray-700">
              Li e concordo com o termo de adoção responsável acima
            </span>
          </label>
          {errors.acceptedTerm && (
            <p className="text-xs text-rose-600 mt-2">{errors.acceptedTerm.message}</p>
          )}
        </Card>

        {errors.root && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="shrink-0" />
            {errors.root.message}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <Link href="/adocao" className={buttonVariants({ variant: 'outline' })}>
            Cancelar
          </Link>
          <Button type="submit" loading={isSubmitting} fullWidth>
            Registrar adoção e gerar termo PDF
          </Button>
        </div>
      </form>
    </div>
  )
}
