'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

const emailSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type EmailFormData = z.infer<typeof emailSchema>

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function EmailLoginForm() {
  const { login } = useAuth()
  const params = useSearchParams()
  const registered = params.get('registered')
  const redirect = params.get('redirect') ?? undefined
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) })

  async function onSubmit(data: EmailFormData) {
    try {
      await login(data.email, data.password, redirect)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao entrar. Tente novamente.'
      setError('root', { message: msg })
    }
  }

  async function handleGoogleLogin() {
    setGoogleError(null)
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setGoogleError('Não foi possível iniciar o login com Google. Tente novamente.')
      setGoogleLoading(false)
    }
  }

  return (
    <>
      {registered && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Cadastro realizado! Verifique seu e-mail e faça login.
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <GoogleIcon />
        {googleLoading ? 'Redirecionando...' : 'Entrar com Google'}
      </button>

      {googleError && (
        <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2 mt-2">{googleError}</p>
      )}

      <div className="relative my-4 flex items-center">
        <div className="flex-1 border-t border-gray-200" />
        <span className="px-3 text-xs text-gray-400">ou entre com e-mail</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

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
