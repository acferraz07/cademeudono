import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PawPrint } from 'lucide-react'
import { tagsApi } from '@/lib/api'
import { SPECIES_LABEL, SIZE_LABEL } from '@/lib/utils'
import type { TagPublicData } from '@/types'
import { LocationShareButton } from './location-share-button'

interface Props {
  params: { code: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchTag(params.code)

  if (!data?.isActive || !data.pet) {
    return { title: 'Cadê Meu Dono — Tag não ativa' }
  }

  return {
    title: `${data.pet.name} — Cadê Meu Dono`,
    description: `Esta tag pertence a ${data.pet.name}. ${data.pet.breed ?? SPECIES_LABEL[data.pet.species as keyof typeof SPECIES_LABEL] ?? ''}. Se você o(a) encontrou, entre em contato com o tutor.`,
    openGraph: {
      title: `Encontrei ${data.pet.name}! 🐾`,
      description: `Clique para ver as informações e contatar o tutor do pet.`,
      images: data.pet.photo ? [{ url: data.pet.photo }] : [],
    },
  }
}

async function fetchTag(code: string): Promise<TagPublicData | null> {
  try {
    return await tagsApi.getPublic(code)
  } catch {
    return null
  }
}

export default async function PublicTagPage({ params }: Props) {
  const data = await fetchTag(params.code)

  if (!data) {
    return <ErrorScreen message="Tag não encontrada" />
  }

  if (!data.isActive || !data.pet) {
    return (
      <ErrorScreen
        message="Esta tag ainda não foi ativada"
        description={data.message}
        code={params.code}
      />
    )
  }

  const { pet, owner, contact } = data
  const speciesLabel = SPECIES_LABEL[pet.species as keyof typeof SPECIES_LABEL] ?? pet.species
  const sizeLabel = pet.size ? SIZE_LABEL[pet.size as keyof typeof SIZE_LABEL] : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center gap-2 py-4 px-4">
        <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center">
          <PawPrint size={12} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-600">Cadê Meu Dono</span>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 pb-10">
        {/* Pet photo */}
        <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-full overflow-hidden shadow-xl border-4 border-white mt-2 mb-6 bg-brand-100">
          {pet.photo ? (
            <Image
              src={pet.photo}
              alt={pet.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl sm:text-7xl">
                {pet.species === 'DOG' ? '🐕' : pet.species === 'CAT' ? '🐈' : '🐾'}
              </span>
            </div>
          )}
        </div>

        {/* Pet name */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">{pet.name}</h1>
        <p className="text-gray-500 mt-1 text-base sm:text-lg">
          {speciesLabel}
          {pet.breed ? ` · ${pet.breed}` : ''}
          {sizeLabel ? ` · ${sizeLabel}` : ''}
        </p>

        {/* Alert banner */}
        <div className="mt-6 w-full max-w-sm bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Smart tag escaneada</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Se você encontrou este pet, use os botões abaixo para entrar em contato com o tutor.
            </p>
          </div>
        </div>

        {/* Physical characteristics */}
        {(pet.coatColor.length > 0 || pet.eyeColor || pet.specificMarks) && (
          <div className="mt-5 w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Características</h2>
            <dl className="space-y-2">
              {pet.coatColor.length > 0 && (
                <Row label="Pelagem" value={pet.coatColor.join(', ')} />
              )}
              {pet.eyeColor && <Row label="Olhos" value={pet.eyeColor} />}
              {pet.specificMarks && (
                <Row label="Marcas" value={pet.specificMarks} />
              )}
            </dl>
          </div>
        )}

        {/* CTAs */}
        {contact?.whatsappUrl && (
          <div className="mt-6 w-full max-w-sm space-y-3">
            {/* WhatsApp simples */}
            <a
              href={contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bc5a] text-white font-semibold rounded-2xl py-4 px-6 text-base transition-colors shadow-lg shadow-green-200 active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Falar com o tutor
            </a>

            {/* Enviar localização */}
            <LocationShareButton
              petName={pet.name}
              tagCode={params.code}
              whatsappNumber={contact.whatsappNumber}
            />

            <p className="text-xs text-center text-gray-400">
              Você será redirecionado para o WhatsApp
            </p>
          </div>
        )}

        {/* Owner first name */}
        {owner?.firstName && (
          <p className="mt-4 text-sm text-gray-400">
            Tutor: <span className="font-medium text-gray-600">{owner.firstName}</span>
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Identificação por{' '}
          <Link href="/" className="text-brand-500 font-medium hover:underline">
            Cadê Meu Dono
          </Link>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Tag {params.code}
        </p>
      </footer>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="text-xs text-gray-400 w-16 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-gray-700 font-medium">{value}</dd>
    </div>
  )
}

function ErrorScreen({
  message,
  description,
  code,
}: {
  message: string
  description?: string
  code?: string
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
        <PawPrint size={32} className="text-brand-400" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{message}</h1>
      {description && <p className="text-sm text-gray-500 max-w-xs">{description}</p>}
      {code && (
        <p className="text-xs text-gray-400 mt-4">Código: {code}</p>
      )}
      <Link
        href="/"
        className="mt-6 text-sm text-brand-600 font-medium hover:underline"
      >
        Ir para Cadê Meu Dono
      </Link>
    </div>
  )
}
