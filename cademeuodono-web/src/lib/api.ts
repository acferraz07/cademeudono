import type {
  User,
  Pet,
  PetHealth,
  Announcement,
  FosterVolunteer,
  OrgProtector,
  PaginatedResponse,
  TagPublicData,
  Breed,
  Adoption,
  ActivityLog,
} from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
const API_URL = `${BASE_URL}/api`

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  url: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = options

  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers as Record<string, string> | undefined),
    },
  })

  let body: Record<string, unknown>
  try {
    body = await res.json()
  } catch {
    throw new ApiError(res.status, 'Resposta inválida do servidor')
  }

  if (!res.ok) {
    const msg = body.message
    throw new ApiError(
      res.status,
      Array.isArray(msg) ? (msg as string[])[0] : (msg as string) ?? 'Erro na requisição',
    )
  }

  return body.data as T
}

// ─── Auth ────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    fullName: string
    email: string
    password: string
    phonePrimary?: string
  }) =>
    request<{ user: User; session: { access_token: string; refresh_token: string } | null }>(
      `${API_URL}/auth/register`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  login: (data: { email: string; password: string }) =>
    request<{ user: User; session: { access_token: string; refresh_token: string } }>(
      `${API_URL}/auth/login`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  logout: (token: string) =>
    request(`${API_URL}/auth/logout`, { method: 'POST', token }),

  forgotPassword: (email: string) =>
    request(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  phoneSendOtp: (phone: string) =>
    request(`${API_URL}/auth/phone/send-otp`, {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  phoneVerifyOtp: (phone: string, code: string) =>
    request<{ user: User; session: { access_token: string; refresh_token: string } }>(
      `${API_URL}/auth/phone/verify-otp`,
      { method: 'POST', body: JSON.stringify({ phone, code }) },
    ),

  whatsappSendOtp: (phone: string) =>
    request(`${API_URL}/auth/whatsapp/send-otp`, {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  whatsappVerifyOtp: (whatsapp: string, code: string) =>
    request<{ user: User; session: { access_token: string; refresh_token: string } }>(
      `${API_URL}/auth/whatsapp/verify-otp`,
      { method: 'POST', body: JSON.stringify({ whatsapp, code }) },
    ),
}

// ─── Users ───────────────────────────────────────────────────

export const usersApi = {
  getMe: (token: string) => request<User>(`${API_URL}/users/me`, { token }),

  updateMe: (token: string, data: Partial<User>) =>
    request<User>(`${API_URL}/users/me`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  getMyPets: (token: string) => request<Pet[]>(`${API_URL}/users/me/pets`, { token }),

  getMyAnnouncements: (token: string) =>
    request<Announcement[]>(`${API_URL}/users/me/announcements`, { token }),

  getMyActivities: (token: string, limit = 50) =>
    request<ActivityLog[]>(`${API_URL}/users/me/activities?limit=${limit}`, { token }),

  uploadAvatar: async (token: string, file: File): Promise<{ avatarUrl: string }> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_URL}/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    let body: Record<string, unknown>
    try {
      body = await res.json()
    } catch {
      throw new ApiError(res.status, 'Resposta inválida do servidor')
    }
    if (!res.ok) {
      const msg = body.message
      throw new ApiError(
        res.status,
        Array.isArray(msg) ? (msg as string[])[0] : (msg as string) ?? 'Erro no upload',
      )
    }
    return body.data as { avatarUrl: string }
  },
}

// ─── Pets ─────────────────────────────────────────────────────

export const petsApi = {
  create: (token: string, data: Partial<Pet>) =>
    request<Pet>(`${API_URL}/pets`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  findAll: (token: string) => request<Pet[]>(`${API_URL}/pets`, { token }),

  findOne: (token: string, id: string) => request<Pet>(`${API_URL}/pets/${id}`, { token }),

  update: (token: string, id: string, data: Partial<Pet>) =>
    request<Pet>(`${API_URL}/pets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  remove: (token: string, id: string) =>
    request(`${API_URL}/pets/${id}`, { method: 'DELETE', token }),

  upsertHealth: (token: string, petId: string, data: Partial<PetHealth>) =>
    request<PetHealth>(`${API_URL}/pets/${petId}/health`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  markAdopted: (token: string, id: string) =>
    request<Pet>(`${API_URL}/pets/${id}/mark-adopted`, { method: 'PATCH', token }),

  findForAdoption: (params?: { species?: string; breedId?: string; size?: string }) => {
    const q = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : ''
    return request<Pet[]>(`${API_URL}/pets/public/adoption${q}`)
  },

  findAdopted: () =>
    request<Pet[]>(`${API_URL}/pets/public/adopted`),

  findPublic: (params?: { species?: string; breedId?: string; size?: string }) => {
    const q = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : ''
    return request<Pet[]>(`${API_URL}/pets/public${q}`)
  },

  findForPetMatch: () =>
    request<Pet[]>(`${API_URL}/pets/public/petmatch`),

  uploadImage: async (token: string, file: File): Promise<{ url: string }> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_URL}/pets/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    let body: Record<string, unknown>
    try {
      body = await res.json()
    } catch {
      throw new ApiError(res.status, 'Resposta inválida do servidor')
    }
    if (!res.ok) {
      const msg = body.message
      throw new ApiError(
        res.status,
        Array.isArray(msg) ? (msg as string[])[0] : (msg as string) ?? 'Erro no upload',
      )
    }
    return body.data as { url: string }
  },
}

// ─── Announcements ────────────────────────────────────────────

export const announcementsApi = {
  create: (token: string, data: Partial<Announcement>) =>
    request<Announcement>(`${API_URL}/announcements`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  findAll: (
    token: string,
    params?: Record<string, string | number | undefined>,
  ) => {
    const q = params
      ? '?' +
        new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined && v !== '')
              .map(([k, v]) => [k, String(v)]),
          ),
        ).toString()
      : ''
    return request<PaginatedResponse<Announcement>>(
      `${API_URL}/announcements${q}`,
      { token },
    )
  },

  findOne: (token: string, id: string) =>
    request<Announcement>(`${API_URL}/announcements/${id}`, { token }),

  updateStatus: (token: string, id: string, status: string) =>
    request<Announcement>(`${API_URL}/announcements/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token,
    }),

  remove: (token: string, id: string) =>
    request(`${API_URL}/announcements/${id}`, { method: 'DELETE', token }),

  findMatches: (token: string, id: string) =>
    request<Announcement[]>(`${API_URL}/announcements/${id}/matches`, { token }),

  uploadImage: async (token: string, file: File): Promise<{ url: string }> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_URL}/announcements/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    let body: Record<string, unknown>
    try {
      body = await res.json()
    } catch {
      throw new ApiError(res.status, 'Resposta inválida do servidor')
    }
    if (!res.ok) {
      const msg = body.message
      throw new ApiError(
        res.status,
        Array.isArray(msg) ? (msg as string[])[0] : (msg as string) ?? 'Erro no upload',
      )
    }
    return body.data as { url: string }
  },
}

// ─── Foster Volunteers ────────────────────────────────────────

export const fosterApi = {
  register: (token: string, data: Partial<FosterVolunteer>) =>
    request<FosterVolunteer>(`${API_URL}/foster-volunteers`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  findMine: (token: string) =>
    request<FosterVolunteer>(`${API_URL}/foster-volunteers/me`, { token }),

  deactivate: (token: string) =>
    request(`${API_URL}/foster-volunteers/me`, { method: 'DELETE', token }),
}

// ─── Breeds ───────────────────────────────────────────────────

export const breedsApi = {
  findAll: (species?: 'DOG' | 'CAT') => {
    const q = species ? `?species=${species}` : ''
    return request<Breed[]>(`${API_URL}/breeds${q}`)
  },
}

// ─── Adoption ─────────────────────────────────────────────────

export const adoptionApi = {
  create: (
    token: string,
    data: { petId: string; fullName: string; cpf: string; acceptedTerm: boolean },
  ) =>
    request<Adoption>(`${API_URL}/adoptions`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  findMy: (token: string) =>
    request<Adoption[]>(`${API_URL}/adoptions/my`, { token }),

  findOne: (token: string, id: string) =>
    request<Adoption>(`${API_URL}/adoptions/${id}`, { token }),
}

// ─── ONG / Protetores ─────────────────────────────────────────

export const orgProtectorsApi = {
  create: (token: string, data: Partial<OrgProtector>) =>
    request<OrgProtector>(`${API_URL}/org-protectors`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  findAll: (params?: { state?: string; city?: string; type?: string }) => {
    const q = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : ''
    return request<OrgProtector[]>(`${API_URL}/org-protectors${q}`)
  },

  findOne: (id: string) =>
    request<OrgProtector>(`${API_URL}/org-protectors/${id}`),

  findMine: (token: string) =>
    request<OrgProtector>(`${API_URL}/org-protectors/me`, { token }),

  update: (token: string, data: Partial<OrgProtector>) =>
    request<OrgProtector>(`${API_URL}/org-protectors/me`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  deactivate: (token: string) =>
    request(`${API_URL}/org-protectors/me`, { method: 'DELETE', token }),
}

// ─── Tags ─────────────────────────────────────────────────────

export const tagsApi = {
  // Chama a rota pública /pet/:code (sem prefixo /api)
  getPublic: (code: string) =>
    request<TagPublicData>(`${BASE_URL}/pet/${code}`),

  validate: (token: string, code: string) =>
    request(`${API_URL}/tags/validate/${code}`, { token }),

  activate: (token: string, data: { code: string; petId: string }) =>
    request(`${API_URL}/tags/activate`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
}
