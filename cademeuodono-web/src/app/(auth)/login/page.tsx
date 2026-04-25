'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const emailSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type EmailFormData = z.infer<typeof emailSchema>

function EmailLoginForm() {
  const { login } = useAuth()
  const params = useSearchParams()
  const registered = params.get('registered')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) })

  async function onSubmit(data: EmailFormData) {
    try {
      await login(data.email, data.password)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao entrar. Tente novamente.'
      setError('root', { message: msg })
    }
  }

  return (
    <>
      {registered && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Cadastro realizado! Verifique seu e-mail e faça login.
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
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
          label="Senha"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 hover:underline">
            Esqueceu a senha?
          </Link>
        </div>
        {errors.root && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{errors.root.message}</p>
        )}
        <Button type="submit" fullWidth loading={isSubmitting} size="lg">Entrar</Button>
      </form>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24 mb-4">
            <Image src="/logo.png" alt="Cadê Meu Dono" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Cadê Meu Dono</h1>
          <p className="text-sm text-gray-500 mt-1">Entre na sua conta</p>
        </div>

        <Suspense fallback={null}>
          <EmailLoginForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500 mt-4">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-brand-600 font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
