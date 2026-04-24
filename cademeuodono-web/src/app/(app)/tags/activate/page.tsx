'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, CheckCircle2, Tag } from 'lucide-react'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { tagsApi, petsApi } from '@/lib/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import type { Pet } from '@/types'

const CODE_REGEX = /^CMD-(ST|GPS)-\d{6}-\d{6}-[A-Z0-9]{4}$/

const schema = z.object({
  code: z
    .string()
    .min(3, 'Código inválido')
    .transform((v) => v.toUpperCase().trim())
    .refine((v) => CODE_REGEX.test(v), {
      message: 'Formato inválido. Esperado: CMD-ST-202604-000001-X7K9',
    }),
  petId: z.string().min(1, 'Selecione um pet'),
})

type FormData = z.infer<typeof schema>

export default function ActivateTagPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!token) return
    petsApi.findAll(token).then(setPets).catch(() => {})
  }, [token])

  async function onSubmit(data: FormData) {
    if (!token) return
    try {
      await tagsApi.activate(token, { code: data.code, petId: data.petId })
      setSuccess(true)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao ativar a tag'
      setError('root', { message: msg })
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Tag ativada com sucesso!</h1>
        <p className="text-sm text-gray-500 mb-6">
          A Smart Tag agora está vinculada ao seu pet. Qualquer pessoa que escaneá-la verá as
          informações do pet e poderá entrar em contato com você.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/tags" className={buttonVariants({ variant: 'primary' })}>
            Ver minhas tags
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tags" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ativar Smart Tag</h1>
          <p className="text-sm text-gray-500">Vincule sua tag a um pet</p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="mb-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <Tag size={16} className="text-brand-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Onde encontro o código?</p>
            <p className="text-xs text-gray-500 mt-0.5">
              O código de ativação vem impresso em um card dentro da embalagem, junto com a sua{' '}
              <span className="font-semibold text-gray-700">CMD Smart Tag (NFC + QR)</span>. Guarde
              esse card com cuidado. Esse código é usado para vincular a Smart Tag ao perfil do pet no
              sistema.
            </p>
            <p className="text-xs text-gray-400 mt-1.5">
              Formato: <span className="font-mono font-semibold text-gray-600">CMD-ST-202604-000001-X7K9</span>
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Dados da ativação</h2>

          <div className="space-y-4">
            <Input
              label="Código de ativação"
              placeholder="CMD-ST-202604-000001-X7K9"
              required
              error={errors.code?.message}
              hint="Código impresso no card dentro da embalagem"
              {...register('code')}
            />

            {pets.length === 0 ? (
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
                Você precisa{' '}
                <Link href="/pets/new" className="font-medium underline">
                  cadastrar um pet
                </Link>{' '}
                antes de ativar uma tag.
              </div>
            ) : (
              <Select
                label="Pet vinculado"
                required
                error={errors.petId?.message}
                {...register('petId')}
              >
                <option value="">Selecione o pet</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} —{' '}
                    {p.species === 'DOG' ? 'Cão' : p.species === 'CAT' ? 'Gato' : 'Outro'}
                    {p.breed ? ` (${p.breed})` : ''}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </Card>

        {errors.root && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="shrink-0" />
            {errors.root.message}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <Link href="/tags" className={buttonVariants({ variant: 'outline' })}>
            Cancelar
          </Link>
          <Button type="submit" loading={isSubmitting} fullWidth disabled={pets.length === 0}>
            Ativar tag
          </Button>
        </div>
      </form>
    </div>
  )
}
