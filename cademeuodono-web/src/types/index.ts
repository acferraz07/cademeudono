export type Role = 'USER' | 'ADMIN' | 'PARTNER'
export type Species = 'DOG' | 'CAT' | 'OTHER'
export type PetSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'GIANT'
export type PetSex = 'MALE' | 'FEMALE'
export type AnnouncementType = 'LOST' | 'FOUND'
export type AnnouncementStatus = 'ACTIVE' | 'RESOLVED' | 'RETURNED_TO_OWNER' | 'ARCHIVED'
export type AdoptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export const PET_BEHAVIORS = ['docil', 'arisco', 'medroso', 'agressivo', 'brincalhao'] as const
export type PetBehavior = (typeof PET_BEHAVIORS)[number]

export const PET_BEHAVIOR_LABEL: Record<PetBehavior, string> = {
  docil: 'Dócil',
  arisco: 'Arisco',
  medroso: 'Medroso',
  agressivo: 'Agressivo',
  brincalhao: 'Brincalhão',
}

export interface Breed {
  id: string
  name: string
  species: 'DOG' | 'CAT'
  size?: PetSize
  group?: string
  isMixed: boolean
}

export interface User {
  id: string
  email: string
  fullName: string
  phonePrimary?: string
  phoneSecondary?: string
  whatsapp?: string
  avatarUrl?: string
  city?: string
  state?: string
  address?: string
  neighborhood?: string
  block?: string
  lotNumber?: string
  streetNumber?: string
  complement?: string
  role: Role
  isActive: boolean
  lgpdAcceptedAt?: string
  createdAt: string
  _count?: { pets: number; announcements: number }
}

export interface OrgProtector {
  id: string
  userId: string
  type: 'ONG' | 'PROTETOR'
  name: string
  cnpj?: string
  description?: string
  phone?: string
  email?: string
  website?: string
  instagram?: string
  state: string
  city: string
  neighborhood?: string
  address?: string
  donationInfo?: string
  pixKey?: string
  logoUrl?: string
  coverUrl?: string
  actingSpecies: string[]
  actingCities: string[]
  isApproved: boolean
  isActive: boolean
  createdAt: string
  user?: { id: string; fullName: string; avatarUrl?: string }
}

export interface ActivityLog {
  id: string
  userId: string
  type: string
  description: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface Pet {
  id: string
  ownerId: string
  name: string
  species: Species
  breed?: string
  breedId?: string
  breedName?: string
  birthDate?: string
  ageEstimate?: string
  sex?: PetSex
  size?: PetSize
  weightKg?: number
  coatColor: string[]
  eyeColor?: string
  coatType?: string
  specificMarks?: string
  isCastrated?: boolean
  microchipNumber?: string
  profilePhotoUrl?: string
  behavior?: string[]
  isUrgent?: boolean
  isLost?: boolean
  isFound?: boolean
  isReturned?: boolean
  isUrgentFoster?: boolean
  lastSeenAt?: string
  lastSeenLocation?: string
  lostNotes?: string
  secretMark?: string
  // Adoção
  isForAdoption?: boolean
  adoptionStory?: string
  adoptionReason?: string
  adoptionRequirements?: string
  isInFosterHome?: boolean
  adoptionUrgency?: string
  isOng?: boolean
  ongName?: string
  isAdopted?: boolean
  adoptedAt?: string
  // PetMatch
  isForPetMatch?: boolean
  petMatchObjective?: string
  petMatchPreferences?: string
  acceptsCrossbreeding?: boolean
  petMatchObservations?: string
  isActive: boolean
  createdAt: string
  health?: PetHealth
  media?: PetMedia[]
  smartTags?: SmartTag[]
}

export interface PetHealth {
  id: string
  petId: string
  vaccinationStatus?: string
  dewormingStatus?: string
  preexistingConditions: string[]
  continuousMedications?: string
  allergies?: string
  specialCare?: string
  vetName?: string
  vetPhone?: string
  vetClinic?: string
  petShop?: string
  bloodType?: string
  generalObservations?: string
}

export interface PetMedia {
  id: string
  url: string
  type: string
  isPrimary: boolean
}

export interface SmartTag {
  id: string
  code: string
  status: 'AVAILABLE' | 'SOLD' | 'ACTIVATION_PENDING' | 'ACTIVE' | 'INACTIVE'
  activatedAt?: string
}

export interface Announcement {
  id: string
  ownerId: string
  type: AnnouncementType
  status: AnnouncementStatus
  petName?: string
  species: Species
  breed?: string
  size?: PetSize
  coatColor: string[]
  eyeColor?: string
  specificMarks?: string
  petPhotoUrl?: string
  state: string
  city: string
  neighborhood?: string
  block?: string
  street?: string
  locationNotes?: string
  eventDate: string
  contactPhone: string
  contactName?: string
  viewsCount: number
  isFeatured: boolean
  createdAt: string
  images: { id: string; url: string; isPrimary: boolean }[]
  owner: { id: string; fullName: string }
}

export interface TagPublicData {
  code: string
  isActive: boolean
  message?: string
  pet?: {
    name: string
    species: string
    breed?: string
    size?: string
    coatColor: string[]
    eyeColor?: string
    specificMarks?: string
    photo?: string | null
    birthDate?: string
    isLost?: boolean
    isUrgent?: boolean
  }
  owner?: {
    firstName: string
    fullName: string
    address?: string | null
  }
  contact?: {
    whatsappNumber: string
    whatsappUrl: string | null
  }
}

export interface FosterVolunteer {
  id: string
  userId: string
  name: string
  phone: string
  state: string
  city: string
  neighborhood?: string
  housingType: 'house' | 'apartment'
  hasOtherPets: boolean
  acceptsDogs: boolean
  acceptsCats: boolean
  acceptedSizes: string[]
  maxPets: number
  availability: 'immediate' | 'occasional'
  experience?: string
  observations?: string
  isActive: boolean
  createdAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at?: number
}

export interface Adoption {
  id: string
  userId: string
  petId: string
  fullName: string
  cpfMasked: string
  acceptedAt: string
  status: AdoptionStatus
  pdfUrl?: string
  ipAddress?: string
  pet?: {
    id: string
    name: string
    species: Species
    profilePhotoUrl?: string
    breed?: string
    breedName?: string
  }
  createdAt: string
}
