import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'

export const metadata: Metadata = {
  title: 'Cadê Meu Dono — Localização e Identificação de Pets',
  description:
    'Plataforma digital para localização, identificação e monitoramento de pets. ' +
    'Smart tags NFC/QR, anúncios de perdidos e encontrados, e muito mais.',
  keywords: ['pets', 'cão perdido', 'gato perdido', 'smart tag', 'NFC pet'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
