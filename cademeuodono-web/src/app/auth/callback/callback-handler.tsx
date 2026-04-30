'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export function CallbackHandler() {
  const { loginWithToken } = useAuth()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (errorParam) {
      setError(errorDescription ?? 'Autenticação cancelada ou recusada.')
      return
    }

    async function handleCallback() {
      // The Supabase SDK automatically exchanges the PKCE code from the URL during
      // initialization (_getSessionFromURL). Calling exchangeCodeForSession manually
      // would fail with AuthPKCECodeVerifierMissingError because the verifier is already
      // consumed. getSession() awaits initializePromise so it returns the session only
      // after the SDK has finished processing the code.
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('[auth/callback] session error:', sessionError)
        setError('Não foi possível finalizar o login com Google. Tente novamente.')
        return
      }

      if (!data.session) {
        console.error('[auth/callback] no session after OAuth exchange')
        setError('Sessão não encontrada. Tente fazer login novamente.')
        return
      }

      try {
        await loginWithToken(data.session.access_token, data.session.refresh_token ?? '')
      } catch (err) {
        console.error('[auth/callback] loginWithToken error:', err)
        setError('Não foi possível autenticar com o servidor. Tente novamente.')
      }
    }

    handleCallback()
  }, [loginWithToken, searchParams])

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
