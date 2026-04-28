'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

function CallbackHandler() {
  const router = useRouter()
  const { loginWithToken } = useAuth()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (errorParam) {
        setError(errorDescription ?? 'Autenticação cancelada ou recusada.')
        return
      }

      let session
      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError || !data.session) {
          setError('Não foi possível finalizar o login com Google. Tente novamente.')
          return
        }
        session = data.session
      } else {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !data.session) {
          setError('Sessão não encontrada. Tente fazer login novamente.')
          return
        }
        session = data.session
      }

      try {
        await loginWithToken(session.access_token, session.refresh_token ?? '')
      } catch {
        setError('Não foi possível autenticar com o servidor. Tente novamente.')
      }
    }

    handleCallback()
  }, [router, loginWithToken, searchParams])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-rose-600 bg-rose-50 rounded-xl px-4 py-3 text-sm mb-4">{error}</p>
          <a href="/login" className="text-sm text-brand-600 font-medium hover:underline">
            Voltar ao login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Finalizando autenticação...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Finalizando autenticação...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}
