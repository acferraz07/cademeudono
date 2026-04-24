import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Cadê Meu Dono — Localização e Identificação de Pets',
  description:
    'Plataforma digital para localização, identificação e monitoramento de pets. ' +
    'Smart tags NFC/QR, anúncios de perdidos e encontrados, e muito mais.',
  keywords: ['pets', 'cão perdido', 'gato perdido', 'smart tag', 'NFC pet'],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: { url: '/logo.png', type: 'image/png' },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cadê Meu Dono',
  },
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
