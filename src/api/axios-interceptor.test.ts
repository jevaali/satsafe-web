// src/api/axios-interceptor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios, { AxiosError } from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { AxiosInterceptor } from './axios-interceptor'

// npm install -D axios-mock-adapter
const api = axios.create()
const mock = new MockAdapter(api)

const getAccessToken = vi.fn()
const onLogout = vi.fn()
const onRefresh = vi.fn()

beforeEach(() => {
  mock.reset()
  vi.clearAllMocks()
  getAccessToken.mockReturnValue('test-token')
})

const setup = () => {
  const interceptor = new AxiosInterceptor(api)
  interceptor.setup(getAccessToken, onLogout, onRefresh)
}

// ------- request interceptor -------

describe('request interceptor', () => {
  it('attaches Bearer token to requests', async () => {
    setup()
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer test-token')
      return [200, {}]
    })
    await api.get('/test')
  })

  it('does not attach Authorization header if no token', async () => {
    getAccessToken.mockReturnValue(null)
    setup()
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined()
      return [200, {}]
    })
    await api.get('/test')
  })
})

// ------- response interceptor — non-401 errors -------

describe('response interceptor — non-401 errors', () => {
  it('passes through 500 errors without refreshing', async () => {
    setup()
    mock.onGet('/test').reply(500)
    await expect(api.get('/test')).rejects.toThrow()
    expect(onRefresh).not.toHaveBeenCalled()
    expect(onLogout).not.toHaveBeenCalled()
  })

  it('passes through 403 errors without refreshing', async () => {
    setup()
    mock.onGet('/test').reply(403)
    await expect(api.get('/test')).rejects.toThrow()
    expect(onRefresh).not.toHaveBeenCalled()
  })
})

// ------- response interceptor — 401 handling -------

describe('response interceptor — 401 handling', () => {
  it('calls onRefresh on 401 and retries the request', async () => {
    setup()
    getAccessToken
      .mockReturnValueOnce('old-token')   // initial request
      .mockReturnValue('new-token')        // after refresh

    onRefresh.mockResolvedValue(undefined)

    // First call returns 401, retry returns 200
    mock.onGet('/test').replyOnce(401).onGet('/test').replyOnce(200, { ok: true })

    const res = await api.get('/test')
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(res.data).toEqual({ ok: true })
  })

  it('calls onLogout and rejects if refresh fails', async () => {
    setup()
    onRefresh.mockRejectedValue(new Error('Refresh failed'))
    mock.onGet('/test').reply(401)

    await expect(api.get('/test')).rejects.toThrow()
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

    it('clears the queue if refresh fails', async () => {
    setup()
    onRefresh.mockRejectedValue(new Error('Refresh failed'))
    mock.onGet('/test').reply(401)

    await expect(api.get('/test')).rejects.toThrow()

    // queue should be empty — a subsequent request should attempt refresh again, not hang
    onRefresh.mockResolvedValue(undefined)
    mock.onGet('/test').replyOnce(401).onGet('/test').reply(200, { ok: true })

    const res = await api.get('/test')
    expect(res.data).toEqual({ ok: true })
    expect(onLogout).toHaveBeenCalledTimes(1)
    })
})

// ------- queue behavior -------

describe('queue behavior', () => {
  it('queues requests that arrive while refresh is in progress and flushes after', async () => {
    setup()

    let resolveRefresh!: () => void
    onRefresh.mockReturnValue(new Promise<void>((res) => { resolveRefresh = res }))

    getAccessToken.mockReturnValue('new-token')

    mock.onGet('/first').replyOnce(401).onGet('/first').reply(200, { from: 'first' })
    mock.onGet('/second').reply(200, { from: 'second' })

    const first = api.get('/first')   // triggers 401 → starts refresh
    const second = api.get('/second') // arrives while refresh in progress → queued

    resolveRefresh()  // finish the refresh

    const [r1, r2] = await Promise.all([first, second])
    expect(r1.data).toEqual({ from: 'first' })
    expect(r2.data).toEqual({ from: 'second' })
    expect(onRefresh).toHaveBeenCalledTimes(1)  // refresh only called once
  })
})