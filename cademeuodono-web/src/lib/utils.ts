import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AnnouncementType, PetSize, PetSex, Species } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SPECIES_LABEL: Record<Species, string> = {
  DOG: 'Cão',
  CAT: 'Gato',
  OTHER: 'Outro',
}

export const SIZE_LABEL: Record<PetSize, string> = {
  SMALL: 'Pequeno',
  MEDIUM: 'Médio',
  LARGE: 'Grande',
  GIANT: 'Gigante',
}

export const SEX_LABEL: Record<PetSex, string> = {
  MALE: 'Macho',
  FEMALE: 'Fêmea',
}

export const ANNOUNCEMENT_TYPE_LABEL: Record<AnnouncementType, string> = {
  LOST: 'Perdido',
  FOUND: 'Encontrado',
}

export const BRAZIL_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

/** Aplica máscara brasileira durante a digitação (celular ou fixo) */
export function phoneMask(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (!d) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Remove máscara — envia apenas dígitos para o backend */
export function cleanPhone(phone: string): string {
  return phone ? phone.replace(/\D/g, '') : ''
}

/** Calcula a idade do pet a partir da data de nascimento */
export function calculatePetAge(birthDate: string): string {
  const birth = new Date(birthDate)
  const now = new Date()
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())

  if (totalMonths < 1) return 'menos de 1 mês'
  if (totalMonths < 12)
    return `${totalMonths} ${totalMonths === 1 ? 'mês' : 'meses'}`

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const yearStr = `${years} ${years === 1 ? 'ano' : 'anos'}`
  if (months === 0) return yearStr
  return `${yearStr} e ${months} ${months === 1 ? 'mês' : 'meses'}`
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('cmd_access_token')
}

export function setStoredToken(token: string, refreshToken: string) {
  localStorage.setItem('cmd_access_token', token)
  localStorage.setItem('cmd_refresh_token', refreshToken)
}

export function clearStoredToken() {
  localStorage.removeItem('cmd_access_token')
  localStorage.removeItem('cmd_refresh_token')
}
