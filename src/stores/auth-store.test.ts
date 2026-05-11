// src/stores/auth-store.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useAuthStore } from './auth-store'
import api from '../api/client'
import { EOperatorType } from '../domain/IUser'

vi.mock('../api/client', () => ({
  default: {
    post: vi.fn(),
  },
}))

const makeJwt = (payload: object): string => {
  const encoded = btoa(JSON.stringify(payload))
  return `header.${encoded}.signature`
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  localStorage.clear()
})

// ------- setAccessToken -------

describe('setAccessToken', () => {
  it('stores token in state and localStorage', () => {
    const store = useAuthStore()
    const result = store.setAccessToken('my-token')
    expect(result).toBe(true)
    expect(store.accessToken).toBe('my-token')
    expect(localStorage.getItem('access_token')).toBe('my-token')
  })

  it('returns false and does nothing for empty string', () => {
    const store = useAuthStore()
    const result = store.setAccessToken('')
    expect(result).toBe(false)
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('returns false for whitespace-only string', () => {
    const store = useAuthStore()
    const result = store.setAccessToken('   ')
    expect(result).toBe(false)
  })
})

// ------- getRefreshToken -------

describe('getRefreshToken', () => {
  it('retrieves refresh token from localStorage', () => {
    const store = useAuthStore()
    localStorage.setItem('refresh_token', 'refresh-abc')
    expect(store.getRefreshToken()).toBe('refresh-abc')
  })

  it('returns null if nothing stored', () => {
    const store = useAuthStore()
    expect(store.getRefreshToken()).toBeNull()
  })
})

// ------- getAccessToken -------

describe('getAccessToken', () => {
  it('returns token from state if set', () => {
    const store = useAuthStore()
    store.setAccessToken('state-token')
    expect(store.getAccessToken()).toBe('state-token')
  })

  it('falls back to localStorage if state is empty', () => {
    localStorage.setItem('access_token', 'stored-token')
    const store = useAuthStore()
    expect(store.getAccessToken()).toBe('stored-token')
  })

  it('returns empty string if nothing stored', () => {
    const store = useAuthStore()
    expect(store.getAccessToken()).toBe('')
  })
})

// ------- isAuthenticated -------

describe('isAuthenticated', () => {
  it('is true when access token is set', () => {
    const store = useAuthStore()
    store.setAccessToken('valid-token')
    expect(store.isAuthenticated).toBe(true)
  })

  it('is false when no token', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })
})

// ------- login -------

describe('login', () => {
  it('sets tokens and user on success', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { jwt: 'access-123', refreshToken: 'refresh-123' },
    })
    const store = useAuthStore()
    await store.login('user@example.com', 'password123')
    expect(store.getAccessToken()).toBe('access-123')
    expect(store.getRefreshToken()).toBe('refresh-123')
    expect(store.user?.email).toBe('user@example.com')
  })

  it('throws if jwt is missing from response', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} })
    const store = useAuthStore()
    await expect(store.login('user@example.com', 'pass')).rejects.toThrow('Invalid login response')
  })

  it('throws first message from response.data.messages', async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { messages: ['Invalid credentials'] } },
    })
    const store = useAuthStore()
    await expect(store.login('user@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
  })

  it('rethrows generic error if no messages array', async () => {
    const error = new Error('Network failure')
    vi.mocked(api.post).mockRejectedValue(error)
    const store = useAuthStore()
    await expect(store.login('user@example.com', 'pass')).rejects.toThrow('Network failure')
  })
})

// ------- register -------

describe('register', () => {
  const registerArgs: [string, string, string, string, string, string, EOperatorType] = [
    'user@example.com',
    'password123',
    'John',
    'Doe',
    'AcmeCorp',
    'US',
    EOperatorType.Commercial,
  ]

  it('sets tokens and user on success', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { jwt: 'access-reg', refreshToken: 'refresh-reg' },
    })
    const store = useAuthStore()
    await store.register(...registerArgs)
    expect(store.getAccessToken()).toBe('access-reg')
    expect(store.user).toMatchObject({
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      operatorName: 'AcmeCorp',
      operatorCountry: 'US',
      operatorType: EOperatorType.Commercial,
    })
  })

  it('throws if jwt missing from response', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} })
    const store = useAuthStore()
    await expect(store.register(...registerArgs)).rejects.toThrow('Invalid register response')
  })

  it('throws first message from response.data.messages', async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { messages: ['Email already taken'] } },
    })
    const store = useAuthStore()
    await expect(store.register(...registerArgs)).rejects.toThrow('Email already taken')
  })
})

// ------- logout -------

describe('logout', () => {
  it('clears state and localStorage', () => {
    const store = useAuthStore()
    store.setAccessToken('token')
    localStorage.setItem('refresh_token', 'refresh')
    store.logout()
    expect(store.accessToken).toBe('')
    expect(store.user).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })
})

// ------- refreshToken -------

describe('refreshToken', () => {
  it('updates tokens on success', async () => {
    localStorage.setItem('access_token', 'old-access')
    localStorage.setItem('refresh_token', 'old-refresh')
    vi.mocked(api.post).mockResolvedValue({
      data: { jwt: 'new-access', refreshToken: 'new-refresh' },
    })
    const store = useAuthStore()
    await store.refreshToken()
    expect(store.getAccessToken()).toBe('new-access')
    expect(store.getRefreshToken()).toBe('new-refresh')
  })

  it('logs out and throws if no refresh token', async () => {
    const store = useAuthStore()
    store.setAccessToken('some-token')
    await expect(store.refreshToken()).rejects.toThrow('No refresh token available')
    expect(store.accessToken).toBe('')
  })

  it('logs out and rethrows if API call fails', async () => {
    localStorage.setItem('refresh_token', 'old-refresh')
    vi.mocked(api.post).mockRejectedValue(new Error('Server error'))
    const store = useAuthStore()
    await expect(store.refreshToken()).rejects.toThrow('Server error')
    expect(store.accessToken).toBe('')
  })
})
