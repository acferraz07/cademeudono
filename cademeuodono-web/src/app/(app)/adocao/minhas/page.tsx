'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { adoptionApi } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { formatDate, SPECIES_LABEL } from '@/lib/utils'
import type { Adoption } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'default',
}

const STATUS_ICON: Record<string, typeof Clock> = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  CANCELLED: XCircle,
}

const SPECIES_EMOJI: Record<string, string> = { DOG: '🐕', CAT: '🐈', OTHER: '🐾' }

export default function MinhasAdocoesPage() {
  const { token } = useAuth()
  const [adoptions, setAdoptions] = useState<Adoption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    adoptionApi
      .findMy(token)
      .then(setAdoptions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/adocao" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Adoções</h1>
          <p className="text-sm text-gray-500 mt-1">Histórico dos seus processos de adoção</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : adoptions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">📋</p>
          <p className="font-medium text-gray-600">Nenhuma adoção registrada</p>
          <p className="text-sm mt-2">
            <Link href="/adocao" className="text-brand-600 hover:underline">
              Ver pets disponíveis para adoção
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {adoptions.map((adoption) => {
            const StatusIcon = STATUS_ICON[adoption.status] ?? Clock
            const petName = adoption.pet?.name ?? 'Pet'
            const petSpecies = adoption.pet?.species ?? 'OTHER'
            const petPhoto = adoption.pet?.profilePhotoUrl
            const breedDisplay = adoption.pet?.breedName ?? adoption.pet?.breed

            return (
              <div
                key={adoption.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Pet photo */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-brand-50 shrink-0">
                    {petPhoto ? (
                      <Image src={petPhoto} alt={petName} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl">
                        {SPECIES_EMOJI[petSpecies] ?? '🐾'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{petName}</h3>
                        <p className="text-xs text-gray-500">
                          {SPECIES_LABEL[petSpecies as keyof typeof SPECIES_LABEL]}
                          {breedDisplay ? ` · ${breedDisplay}` : ''}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[adoption.status]}>
                        <StatusIcon size={11} />
                        {STATUS_LABEL[adoption.status]}
                      </Badge>
                    </div>

                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        Adotante: <span className="font-medium text-gray-700">{adoption.fullName}</span>
                      </p>
                      {adoption.cpfMasked && (
                        <p className="text-xs text-gray-500">
                          CPF: <span className="font-medium text-gray-700">{adoption.cpfMasked}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Registrado em {formatDate(adoption.acceptedAt ?? adoption.createdAt)}
                      </p>
                    </div>

                    {adoption.pdfUrl && (
                      <a
                        href={adoption.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                      >
                        <Download size={13} />
                        Baixar termo de adoção (PDF)
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
