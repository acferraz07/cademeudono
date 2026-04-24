'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { orgProtectorsApi } from '@/lib/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const schema = z.object({
  type: z.enum(['ONG', 'PROTETOR']),
  name: z.string().min(2, 'Nome obrigatório').max(100),
  cnpj: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  website: z.string().optional(),
  instagram: z.string().optional(),
  state: z.string().min(2, 'Estado obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  donationInfo: z.string().optional(),
  pixKey: z.string().optional(),
  actingSpeciesDog: z.boolean().optional(),
  actingSpeciesCat: z.boolean().optional(),
  actingCities: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewOrgProtectorPage() {
  const router = useRouter()
  const { token } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'ONG' },
  })

  const watchType = watch('type')

  async function onSubmit(data: FormData) {
    if (!token) return
    try {
      const actingSpecies: string[] = []
      if (data.actingSpeciesDog) actingSpecies.push('DOG')
      if (data.actingSpeciesCat) actingSpecies.push('CAT')

      await orgProtectorsApi.create(token, {
        type: data.type,
        name: data.name,
        cnpj: data.cnpj || undefined,
        description: data.description || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        website: data.website || undefined,
        instagram: data.instagram || undefined,
        state: data.state,
        city: data.city,
        neighborhood: data.neighborhood || undefined,
        address: data.address || undefined,
        donationInfo: data.donationInfo || undefined,
        pixKey: data.pixKey || undefined,
        actingSpecies,
        actingCities: data.actingCities
          ? data.actingCities.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      })

      router.push('/ongs-protetores')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao salvar. Tente novamente.'
      setError('root', { message: msg })
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ongs-protetores" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cadastrar ONG ou Protetor(a)</h1>
          <p className="text-sm text-gray-500">Seu cadastro passará por aprovação antes de aparecer no diretório</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🏢</span> Dados principais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Tipo" required error={errors.type?.message} {...register('type')}>
              <option value="ONG">🏢 ONG</option>
              <option value="PROTETOR">🤝 Protetor(a) independente</option>
            </Select>
            <Input
              label="Nome"
              placeholder={watchType === 'ONG' ? 'Anjos de 4 Patas' : 'Seu nome ou apelido'}
              required
              error={errors.name?.message}
              {...register('name')}
            />
            {watchType === 'ONG' && (
              <Input
                label="CNPJ"
                placeholder="00.000.000/0001-00"
                error={errors.cnpj?.message}
                {...register('cnpj')}
              />
            )}
            <Input
              label="Telefone / WhatsApp"
              placeholder="(63) 99999-9999"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="contato@ong.org.br"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Site"
              placeholder="https://minhaong.org.br"
              error={errors.website?.message}
              {...register('website')}
            />
            <Input
              label="Instagram"
              placeholder="@minhaong"
              error={errors.instagram?.message}
              {...register('instagram')}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Descrição"
              placeholder="Apresente sua ONG ou seu trabalho como protetor..."
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">📍</span> Localização
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Estado" required error={errors.state?.message} {...register('state')}>
              <option value="">Selecione</option>
              <option value="TO">Tocantins</option>
              <option value="GO">Goiás</option>
              <option value="PA">Pará</option>
              <option value="MT">Mato Grosso</option>
              <option value="MA">Maranhão</option>
              <option value="PI">Piauí</option>
              <option value="BA">Bahia</option>
              <option value="MG">Minas Gerais</option>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="PR">Paraná</option>
              <option value="SC">Santa Catarina</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="DF">Distrito Federal</option>
              <option value="outro">Outro</option>
            </Select>
            <Input
              label="Cidade"
              placeholder="Palmas"
              required
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
              placeholder="Quadra, Lote, Rua..."
              error={errors.address?.message}
              {...register('address')}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Cidades de atuação"
              placeholder="Palmas, Porto Nacional, Paraíso..."
              hint="Separe por vírgula"
              error={errors.actingCities?.message}
              {...register('actingCities')}
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🐾</span> Espécies atendidas
          </h2>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded" {...register('actingSpeciesDog')} />
              <span className="text-sm text-gray-700">🐕 Cães</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded" {...register('actingSpeciesCat')} />
              <span className="text-sm text-gray-700">🐈 Gatos</span>
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">💛</span> Doações
          </h2>
          <div className="space-y-4">
            <Textarea
              label="Como ajudar"
              placeholder="Aceitamos ração, remédios, dinheiro via PIX..."
              error={errors.donationInfo?.message}
              {...register('donationInfo')}
            />
            <Input
              label="Chave PIX"
              placeholder="pix@ong.org.br ou CNPJ"
              error={errors.pixKey?.message}
              {...register('pixKey')}
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
          <Link href="/ongs-protetores" className={buttonVariants({ variant: 'outline' })}>
            Cancelar
          </Link>
          <Button type="submit" loading={isSubmitting} fullWidth>
            Enviar para aprovação
          </Button>
        </div>
      </form>
    </div>
  )
}
