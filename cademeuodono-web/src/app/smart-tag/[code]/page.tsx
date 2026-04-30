'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PawPrint, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { petsApi, tagsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { Pet, TagPublicData } from '@/types'

interface SmartTagRow {
  code: string
  status: string
  pet_id: string | null
  tutor_id: string | null
  activated_at: string | null
  lote: string | null
  sub_lote: string | null
}

type PageState =
  | { type: 'loading' }
  | { type: 'not_found' }
  | { type: 'available' }
  | { type: 'select_pet'; pets: Pet[] }
  | { type: 'activating' }
  | { type: 'success' }
  | { type: 'active'; data: TagPublicData }
  | { type: 'error'; message: string }

export default function SmartTagPage({ params }: { params: { code: string } }) {
  const { user, token, isLoading: authLoading } = useAuth()
  const [state, setState] = useState<PageState>({ type: 'loading' })
  const [selectedPetId, setSelectedPetId] = useState('')
  const [isLoadingPets, setIsLoadingPets] = useState(false)
  const code = params.code

  useEffect(() => {
    async function fetchTag() {
      const { data, error } = await supabase
        .from('smart_tags_new')
        .select('code, status, pet_id, tutor_id, activated_at, lote, sub_lote')
        .eq('code', code)
        .single()

      if (error || !data) {
        setState({ type: 'not_found' })
        return
      }

      const tag = data as SmartTagRow

      if (tag.status === 'ACTIVE') {
        await fetchActiveData()
      } else if (tag.status === 'AVAILABLE') {
        setState({ type: 'available' })
      } else {
        setState({ type: 'not_found' })
      }
    }

    fetchTag()
  }, [code])

  async function fetchActiveData() {
    try {
      const data = await tagsApi.getPublic(code)
      if (!data.isActive || !data.pet) {
        setState({ type: 'error', message: data.message ?? 'Não foi possível carregar as informações do pet' })
        return
      }
      setState({ type: 'active', data })
    } catch {
      setState({ type: 'error', message: 'Não foi possível carregar as informações do pet' })
    }
  }

  async function handleActivateClick() {
    if (!user || !token) return
    setIsLoadingPets(true)
    try {
      const pets = await petsApi.findAll(token)
      setSelectedPetId('')
      setState({ type: 'select_pet', pets })
    } catch {
      setState({ type: 'error', message: 'Erro ao carregar seus pets. Tente novamente.' })
    } finally {
      setIsLoadingPets(false)
    }
  }

  async function handleConfirmActivation() {
    if (!user || !selectedPetId) return
    setState({ type: 'activating' })

    const { error } = await supabase.rpc('activate_smart_tag', {
      p_code: code,
      p_pet_id: selectedPetId,
      p_tutor_id: user.id,
    })

    if (error) {
      setState({ type: 'error', message: error.message ?? 'Erro ao ativar a Smart Tag' })
      return
    }

    setState({ type: 'success' })
  }

  if (authLoading || state.type === 'loading') {
    return (
      <PageShell>
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageShell>
    )
  }

  if (state.type === 'not_found') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
          <PawPrint size={32} className="text-brand-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Smart Tag não encontrada</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          Verifique se o código está correto ou entre em contato com o suporte.
        </p>
        <p className="text-xs text-gray-400 mt-4">Código: {code}</p>
        <Link href="/" className="mt-6 text-sm text-brand-600 font-medium hover:underline">
          Ir para Cadê Meu Dono
        </Link>
      </div>
    )
  }

  if (state.type === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Algo deu errado</h1>
        <p className="text-sm text-gray-500 max-w-xs">{state.message}</p>
        <Link href="/" className="mt-6 text-sm text-brand-600 font-medium hover:underline">
          Ir para Cadê Meu Dono
        </Link>
      </div>
    )
  }

  if (state.type === 'success') {
    return (
      <PageShell>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Smart Tag ativada com sucesso!</h1>
          <p className="text-sm text-gray-500 max-w-xs mb-6">
            A tag está vinculada ao seu pet. Quando alguém escanear, verá o perfil e poderá entrar em
            contato com você.
          </p>
          <Link href="/tags" className="text-sm text-brand-600 font-medium hover:underline">
            Ver minhas tags
          </Link>
        </div>
      </PageShell>
    )
  }

  if (state.type === 'activating') {
    return (
      <PageShell>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Ativando sua Smart Tag...</p>
        </div>
      </PageShell>
    )
  }

  if (state.type === 'active') {
    const { pet, owner, contact } = state.data
    const speciesLabel = pet!.species === 'DOG' ? 'Cão' : pet!.species === 'CAT' ? 'Gato' : 'Pet'
    const coatColors = Array.isArray(pet!.coatColor) ? pet!.coatColor : []

    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
        <PageHeader />

        <main className="flex-1 flex flex-col items-center px-4 pb-10">
          <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-full overflow-hidden shadow-xl border-4 border-white mt-2 mb-6 bg-brand-100">
            {pet!.photo ? (
              <Image
                src={pet!.photo}
                alt={pet!.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl sm:text-7xl">
                  {pet!.species === 'DOG' ? '🐕' : pet!.species === 'CAT' ? '🐈' : '🐾'}
                </span>
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">{pet!.name}</h1>
          <p className="text-gray-500 mt-1 text-base">
            {speciesLabel}
            {pet!.breed ? ` · ${pet!.breed}` : ''}
          </p>

          <div className="mt-6 w-full max-w-sm bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Smart tag escaneada</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Se você encontrou este pet, use o botão abaixo para entrar em contato com o tutor.
              </p>
            </div>
          </div>

          {(coatColors.length > 0 || pet!.eyeColor || pet!.specificMarks) && (
            <div className="mt-5 w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">Características</h2>
              <dl className="space-y-2">
                {coatColors.length > 0 && (
                  <CharRow label="Pelagem" value={coatColors.join(', ')} />
                )}
                {pet!.eyeColor && <CharRow label="Olhos" value={pet!.eyeColor} />}
                {pet!.specificMarks && <CharRow label="Marcas" value={pet!.specificMarks} />}
              </dl>
            </div>
          )}

          {owner?.fullName && (
            <div className="mt-5 w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">Tutor</h2>
              <dl className="space-y-2">
                <CharRow label="Nome" value={owner.fullName} />
                {owner.address && <CharRow label="Local" value={owner.address} />}
                {contact?.whatsappNumber && (
                  <CharRow label="Telefone" value={formatPhone(contact.whatsappNumber)} />
                )}
              </dl>
            </div>
          )}

          {contact?.whatsappNumber && (
            <div className="mt-6 w-full max-w-sm space-y-3">
              <a
                href={buildWhatsAppUrl(contact.whatsappNumber, pet!.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bc5a] text-white font-semibold rounded-2xl py-4 px-6 text-base transition-colors shadow-lg shadow-green-200 active:scale-95"
              >
                <WhatsAppIcon />
                Entrar em contato pelo WhatsApp
              </a>
              <p className="text-xs text-center text-gray-400">Você será redirecionado para o WhatsApp</p>
            </div>
          )}
        </main>

        <footer className="py-6 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Identificação por{' '}
            <Link href="/" className="text-brand-500 font-medium hover:underline">
              Cadê Meu Dono
            </Link>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Tag {code}</p>
        </footer>
      </div>
    )
  }

  if (state.type === 'available') {
    if (!user) {
      return (
        <PageShell>
          <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
              <PawPrint size={32} className="text-brand-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Ativar Smart Tag</h1>
            <p className="text-sm text-gray-500 max-w-xs mb-1">
              Esta Smart Tag ainda não foi ativada. Faça login para vinculá-la ao seu pet.
            </p>
            <p className="text-xs text-gray-400 mb-6">Código: {code}</p>
            <Link
              href={`/login?redirect=/smart-tag/${code}`}
              className="inline-flex items-center justify-center h-12 px-6 text-base rounded-xl font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              Fazer login para ativar
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Não tem conta?{' '}
              <Link href="/register" className="text-brand-600 font-medium hover:underline">
                Cadastre-se
              </Link>
            </p>
          </main>
        </PageShell>
      )
    }

    return (
      <PageShell>
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
            <PawPrint size={32} className="text-brand-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Ativar Smart Tag</h1>
          <p className="text-sm text-gray-500 max-w-xs mb-1">
            Esta tag está disponível para ativação. Vincule-a a um dos seus pets.
          </p>
          <p className="text-xs text-gray-400 mb-6">Código: {code}</p>
          <Button onClick={handleActivateClick} size="lg" loading={isLoadingPets}>
            Ativar Smart Tag
          </Button>
        </main>
      </PageShell>
    )
  }

  if (state.type === 'select_pet') {
    return (
      <PageShell>
        <main className="flex-1 flex flex-col px-4 pt-6 pb-10 max-w-md mx-auto w-full">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Selecionar pet</h1>
          <p className="text-sm text-gray-500 mb-4">
            Escolha qual pet será vinculado a esta Smart Tag
          </p>

          {state.pets.length === 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 mb-4">
              Você não tem pets cadastrados.{' '}
              <Link href="/pets/new" className="font-medium underline">
                Cadastrar pet
              </Link>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {state.pets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                    selectedPetId === pet.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {pet.profilePhotoUrl ? (
                      <Image
                        src={pet.profilePhotoUrl}
                        alt={pet.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-lg">
                        {pet.species === 'DOG' ? '🐕' : pet.species === 'CAT' ? '🐈' : '🐾'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{pet.name}</p>
                    <p className="text-xs text-gray-500">
                      {pet.species === 'DOG' ? 'Cão' : pet.species === 'CAT' ? 'Gato' : 'Outro'}
                      {pet.breed ? ` · ${pet.breed}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <Link
            href="/pets/new"
            className="text-sm text-brand-600 font-medium hover:underline mb-6 inline-block"
          >
            + Cadastrar novo pet
          </Link>

          <Button
            onClick={handleConfirmActivation}
            disabled={!selectedPetId}
            fullWidth
            size="lg"
          >
            Confirmar ativação
          </Button>
        </main>
      </PageShell>
    )
  }

  return null
}

function PageHeader() {
  return (
    <header className="flex items-center justify-center gap-2 py-4 px-4">
      <Image
        src="/logo-smarttag.png"
        alt="Cadê Meu Dono"
        width={28}
        height={28}
      />
      <span className="text-sm font-semibold text-gray-600">Cadê Meu Dono</span>
    </header>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
      <PageHeader />
      {children}
    </div>
  )
}

function CharRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="text-xs text-gray-400 w-16 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-gray-700 font-medium">{value}</dd>
    </div>
  )
}

function buildWhatsAppUrl(rawNumber: string, petName: string): string {
  const name = petName || 'seu pet'
  const message =
    'Olá! Tudo bem?!\n\n' +
    `⚠️ *Sua Smart Tag Cadê Meu Dono do pet ${name} foi escaneada!*\n\n` +
    `Encontrei o(a) ${name}! Ele(a) está comigo e em segurança.\n\n` +
    'Podemos combinar a melhor forma para devolvê-lo(a)? 🐾'
  const digits = rawNumber.replace(/\D/g, '')
  const number = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

function formatPhone(raw: string): string {
  const digits = raw.startsWith('55') ? raw.slice(2) : raw
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return raw
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
