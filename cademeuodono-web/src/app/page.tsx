import { redirect } from 'next/navigation'

// Raiz redireciona para o dashboard (o layout autenticado cuida do redirecionamento para login)
export default function RootPage() {
  redirect('/dashboard')
}
