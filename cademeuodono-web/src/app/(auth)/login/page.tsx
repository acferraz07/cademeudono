'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { useAuth, ApiError } from '@/contexts/auth-context'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'

type LoginMode = 'email' | 'whatsapp'

const emailSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

const phoneSchema = z.object({
  phone: z.string().min(14, 'Telefone inválido'),
})

const otpSchema = z.object({
  code: z.string().length(6, 'O código deve ter 6 dígitos').regex(/^\d{6}$/, 'Apenas números'),
})

type EmailFormData = z.infer<typeof emailSchema>
type PhoneFormData = z.infer<typeof phoneSchema>
type OtpFormData = z.infer<typeof otpSchema>

function normalizePhone(masked: string): string {
  const digits = masked.replace(/\D/g, '')
  return `+55${digits}`
}

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

function WhatsappOtpForm() {
  const { loginWithToken } = useAuth()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [pendingPhone, setPendingPhone] = useState('')
  const [globalError, setGlobalError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const phoneForm = useForm<PhoneFormData>({ resolver: zodResolver(phoneSchema) })
  const otpForm = useForm<OtpFormData>({ resolver: zodResolver(otpSchema) })

  async function onSendOtp(data: PhoneFormData) {
    setGlobalError('')
    const phone = normalizePhone(data.phone)
    try {
      await authApi.whatsappSendOtp(phone)
      setPendingPhone(phone)
      setSuccessMsg(`Código enviado para ${data.phone}`)
      setStep('otp')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao enviar código via WhatsApp'
      setGlobalError(msg)
    }
  }

  async function onVerifyOtp(data: OtpFormData) {
    setGlobalError('')
    try {
      const result = await authApi.whatsappVerifyOtp(pendingPhone, data.code)
      if (result?.session) {
        await loginWithToken(result.session.access_token, result.session.refresh_token)
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Código inválido ou expirado'
      otpForm.setError('root', { message: msg })
    }
  }

  if (step === 'phone') {
    return (
      <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
        <PhoneInput
          label="WhatsApp"
          hint="Você receberá um código de 6 dígitos pelo WhatsApp"
          required
          error={phoneForm.formState.errors.phone?.message}
          {...phoneForm.register('phone')}
        />
        {globalError && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{globalError}</p>
        )}
        <Button type="submit" fullWidth loading={phoneForm.formState.isSubmitting} size="lg">
          Enviar código
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}
      <Input
        label="Código de verificação"
        placeholder="000000"
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        error={otpForm.formState.errors.code?.message}
        {...otpForm.register('code')}
      />
      {otpForm.formState.errors.root && (
        <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">
          {otpForm.formState.errors.root.message}
        </p>
      )}
      <Button type="submit" fullWidth loading={otpForm.formState.isSubmitting} size="lg">
        Verificar e entrar
      </Button>
      <button
        type="button"
        onClick={() => { setStep('phone'); otpForm.reset() }}
        className="text-xs text-brand-600 hover:underline text-center"
      >
        Usar outro número
      </button>
    </form>
  )
}

function LoginContent() {
  const [mode, setMode] = useState<LoginMode>('email')

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-24 h-24 mb-4">
          <Image src="/logo.png" alt="Cadê Meu Dono" fill className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Cadê Meu Dono</h1>
        <p className="text-sm text-gray-500 mt-1">Entre na sua conta</p>
      </div>

      {/* Mode selector */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 mb-4 gap-1">
        <button
          onClick={() => setMode('email')}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${mode === 'email' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          E-mail
        </button>
        <button
          onClick={() => setMode('whatsapp')}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${mode === 'whatsapp' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          WhatsApp
        </button>
      </div>

      <Suspense fallback={null}>
        {mode === 'email' && <EmailLoginForm />}
        {mode === 'whatsapp' && <WhatsappOtpForm />}
      </Suspense>

      <p className="text-center text-sm text-gray-500 mt-4">
        Não tem uma conta?{' '}
        <Link href="/register" className="text-brand-600 font-medium hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50 flex items-center justify-center p-4">
      <LoginContent />
    </div>
  )
}
