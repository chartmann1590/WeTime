const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

async function fetchApi(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  auth: {
    signup: (data: { email: string; password: string; name: string }) =>
      fetchApi('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => fetchApi('/auth/logout', { method: 'POST' }),
  },
  couple: {
    create: () => fetchApi('/couple/create', { method: 'POST' }),
    join: (code: string) => fetchApi('/couple/join', { method: 'POST', body: JSON.stringify({ code }) }),
    get: () => fetchApi('/couple'),
  },
  user: {
    getProfile: () => fetchApi('/user/profile'),
    updateProfile: (data: { email?: string; name?: string }) =>
      fetchApi('/user/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    updatePassword: (data: { currentPassword: string; newPassword: string }) =>
      fetchApi('/user/password', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  calendars: {
    list: () => fetchApi('/calendars'),
    create: (data: { type: string; name: string; color?: string; icsUrl?: string }) =>
      fetchApi('/calendars', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; color?: string }) =>
      fetchApi(`/calendars/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/calendars/${id}`, { method: 'DELETE' }),
    refresh: (id: string) => fetchApi(`/calendars/${id}/refresh`, { method: 'POST' }),
    import: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return fetch(`${API_BASE}/calendars/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Import failed'))))
    },
    export: (id: string) => `${API_BASE}/calendars/${id}/export.ics`,
  },
  events: {
    list: (rangeStart: Date, rangeEnd: Date) =>
      fetchApi(`/events?rangeStart=${rangeStart.toISOString()}&rangeEnd=${rangeEnd.toISOString()}`),
    create: (data: any) => fetchApi('/events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/events/${id}`, { method: 'DELETE' }),
    attend: (id: string, status: string) =>
      fetchApi(`/events/${id}/attend`, { method: 'POST', body: JSON.stringify({ status }) }),
  },
  settings: {
    getSmtp: () => fetchApi('/settings/smtp'),
    saveSmtp: (data: any) => fetchApi('/settings/smtp', { method: 'POST', body: JSON.stringify(data) }),
    testSmtp: () => fetchApi('/settings/smtp/test', { method: 'POST' }),
  },
  admin: {
    cleanupDuplicates: () => fetchApi('/admin/cleanup-duplicates', { method: 'POST' }),
    users: {
      list: () => fetchApi('/admin/users'),
      create: (data: any) => fetchApi('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => fetchApi(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => fetchApi(`/admin/users/${id}`, { method: 'DELETE' }),
    },
    calendars: {
      list: () => fetchApi('/admin/calendars'),
      create: (data: any) => fetchApi('/admin/calendars', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => fetchApi(`/admin/calendars/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => fetchApi(`/admin/calendars/${id}`, { method: 'DELETE' }),
    },
    events: {
      list: (limit?: number, offset?: number) => {
        const params = new URLSearchParams()
        if (limit) params.set('limit', limit.toString())
        if (offset) params.set('offset', offset.toString())
        return fetchApi(`/admin/events?${params.toString()}`)
      },
      create: (data: any) => fetchApi('/admin/events', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => fetchApi(`/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => fetchApi(`/admin/events/${id}`, { method: 'DELETE' }),
    },
    couples: {
      list: () => fetchApi('/admin/couples'),
      delete: (id: string) => fetchApi(`/admin/couples?id=${id}`, { method: 'DELETE' }),
    },
  },
}

