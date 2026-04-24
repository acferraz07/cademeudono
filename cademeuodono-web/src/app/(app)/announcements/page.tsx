'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { announcementsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { AnnouncementCard } from '@/components/announcements/announcement-card'
import { BRAZIL_STATES } from '@/lib/utils'
import type { Announcement } from '@/types'

const INITIAL_FILTERS = { type: '', species: '', size: '', state: '', city: '' }

export default function AnnouncementsPage() {
  const { token } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    announcementsApi
      .findAll(token, { ...filters, page, limit: 20 })
      .then((res) => {
        setAnnouncements(res.items)
        setTotal(res.meta.total)
      })
      .finally(() => setLoading(false))
  }, [token, filters, page])

  function updateFilter(key: keyof typeof INITIAL_FILTERS, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anúncios</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Carregando...' : `${total} anúncios encontrados`}
          </p>
        </div>
        <Button asChild>
          <Link href="/announcements/new">
            <Plus size={16} />
            Publicar
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={15} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
          >
            <option value="">Tipo</option>
            <option value="LOST">Perdido</option>
            <option value="FOUND">Encontrado</option>
          </Select>

          <Select
            value={filters.species}
            onChange={(e) => updateFilter('species', e.target.value)}
          >
            <option value="">Espécie</option>
            <option value="DOG">Cão</option>
            <option value="CAT">Gato</option>
            <option value="OTHER">Outro</option>
          </Select>

          <Select
            value={filters.size}
            onChange={(e) => updateFilter('size', e.target.value)}
          >
            <option value="">Porte</option>
            <option value="SMALL">Pequeno</option>
            <option value="MEDIUM">Médio</option>
            <option value="LARGE">Grande</option>
            <option value="GIANT">Gigante</option>
          </Select>

          <Select
            value={filters.state}
            onChange={(e) => updateFilter('state', e.target.value)}
          >
            <option value="">Estado</option>
            {BRAZIL_STATES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilters(INITIAL_FILTERS); setPage(1) }}
            className="text-gray-400 hover:text-gray-700"
          >
            Limpar
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <span className="text-5xl mb-4">🔍</span>
          <p className="font-semibold text-gray-900 text-lg">Nenhum anúncio encontrado</p>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            Tente outros filtros ou seja o primeiro a publicar
          </p>
          <Button asChild>
            <Link href="/announcements/new">
              <Plus size={16} />
              Publicar anúncio
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="flex items-center text-sm text-gray-500 px-3">
                Página {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={announcements.length < 20}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
