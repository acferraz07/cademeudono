'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z
  .object({
    fullName: z.string().min(2, 'Nome muito curto').max(100),
    email: z.string().email('E-mail inválido'),
    phonePrimary: z.string().optional(),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
    lgpdAccepted: z.boolean().refine((v) => v === true, {
      message: 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar',
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit({ confirmPassword, lgpdAccepted, ...data }: FormData) {
    try {
      await registerUser({ ...data, lgpdAccepted })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao cadastrar. Tente novamente.'
      setError('root', { message: msg })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24 mb-4">
            <Image src="/logo.png" alt="Cadê Meu Dono" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1">Comece a proteger seu pet agora</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4"
        >
          <Input
            label="Nome completo"
            placeholder="João Silva"
            autoComplete="name"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Telefone"
            type="tel"
            placeholder="(63) 99999-9999"
            autoComplete="tel"
            hint="Usado para contato nas fichas dos seus pets"
            error={errors.phonePrimary?.message}
            {...register('phonePrimary')}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirmar senha"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              {...register('lgpdAccepted', { setValueAs: (v) => Boolean(v) })}
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              Li e aceito os{' '}
              <Link href="/terms" className="text-brand-600 hover:underline font-medium" target="_blank">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/privacy" className="text-brand-600 hover:underline font-medium" target="_blank">
                Política de Privacidade (LGPD)
              </Link>
              . *
            </span>
          </label>
          {errors.lgpdAccepted && (
            <p className="text-xs text-rose-600">{errors.lgpdAccepted.message}</p>
          )}

          {errors.root && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" fullWidth loading={isSubmitting} size="lg">
            Criar conta
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
