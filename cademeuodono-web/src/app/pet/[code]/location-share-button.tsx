'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'

interface Props {
  petName: string
  tagCode: string
  whatsappNumber: string
}

export function LocationShareButton({ petName, tagCode, whatsappNumber }: Props) {
  const [loading, setLoading] = useState(false)

  function handleClick() {
    setLoading(true)

    if (!navigator.geolocation) {
      openWhatsAppWithoutLocation()
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`
        const message =
          `Olá! Encontrei o pet ${petName} através da Smart Tag Cadê Meu Dono.\n` +
          `A tag escaneada foi: ${tagCode}\n` +
          `Minha localização aproximada é:\n${mapsLink}\n` +
          `Podemos combinar a melhor forma para devolvê-lo? 🐾`
        openWhatsApp(message)
        setLoading(false)
      },
      () => {
        openWhatsAppWithoutLocation()
        setLoading(false)
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  function openWhatsApp(message: string) {
    const number = whatsappNumber.replace(/\D/g, '')
    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  function openWhatsAppWithoutLocation() {
    const message =
      `Olá! Encontrei o pet ${petName} através da Smart Tag Cadê Meu Dono.\n` +
      `A tag escaneada foi: ${tagCode}\n` +
      `Não foi possível compartilhar minha localização automaticamente. ` +
      `Podemos combinar o local de devolução? 🐾`
    openWhatsApp(message)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center justify-center gap-3 w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold rounded-2xl py-3.5 px-6 text-sm transition-colors active:scale-95"
    >
      <MapPin size={18} className="shrink-0" />
      {loading ? 'Obtendo localização...' : 'Enviar minha localização ao tutor'}
    </button>
  )
}
