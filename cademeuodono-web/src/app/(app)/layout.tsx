'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { AppShell } from '@/components/layout/app-shell'
import { FullPageSpinner } from '@/components/ui/spinner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) return <FullPageSpinner />
  if (!user) return null

  return <AppShell>{children}</AppShell>
}
