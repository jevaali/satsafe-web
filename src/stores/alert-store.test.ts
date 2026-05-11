// src/stores/alert-store.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useAlertStore } from './alert-store'
import { AlertService } from '../services/api-services/AlertService'
import type { IAlertListItem, IAlertDetail } from '../domain/IAlert'
import { EAlertSeverity, EConjunctionEventStatus } from '../domain/IAlert'

vi.mock('../services/api-services/AlertService')

const mockAlerts: IAlertListItem[] = [
  {
    id: '1',
    message: 'Alert one',
    isAcknowledged: false,
    createdAt: '2024-01-01T00:00:00Z',
    severity: EAlertSeverity.High,
    conjunctionEventId: 'evt-1',
    hasConjunctionEvent: true,
  },
  {
    id: '2',
    message: 'Alert two',
    isAcknowledged: true,
    createdAt: '2024-01-02T00:00:00Z',
    severity: EAlertSeverity.Low,
    conjunctionEventId: 'evt-2',
    hasConjunctionEvent: false,
  },
]

const mockDetail: IAlertDetail = {
  id: '1',
  message: 'Alert one',
  isAcknowledged: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T12:00:00Z',
  severity: EAlertSeverity.High,
  conjunctionEventId: 'evt-1',
  conjunctionEvent: {
    id: 'evt-1',
    timeOfClosestApproach: '2024-01-02T06:00:00Z',
    missDistance: 150,
    collisionProbability: 0.002,
    isHighRisk: true,
    status: EConjunctionEventStatus.Potential,
  },
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ------- computed -------

describe('computed', () => {
  it('count returns number of alerts', async () => {
    vi.mocked(AlertService.list).mockResolvedValue(mockAlerts)
    const store = useAlertStore()
    await store.fetchList()
    expect(store.count).toBe(2)
  })

  it('unacknowledgedCount only counts unacknowledged', async () => {
    vi.mocked(AlertService.list).mockResolvedValue(mockAlerts)
    const store = useAlertStore()
    await store.fetchList()
    expect(store.unacknowledgedCount).toBe(1)
  })
})

// ------- fetchList -------

describe('fetchList', () => {
  it('populates alerts on success', async () => {
    vi.mocked(AlertService.list).mockResolvedValue(mockAlerts)
    const store = useAlertStore()
    await store.fetchList()
    expect(store.alerts).toEqual(mockAlerts)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('sets error message on failure', async () => {
    vi.mocked(AlertService.list).mockRejectedValue({ message: 'Network error' })
    const store = useAlertStore()
    await store.fetchList()
    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })

  it('prefers response.data.messages over generic message', async () => {
    vi.mocked(AlertService.list).mockRejectedValue({
      response: { data: { messages: ['Server said no'] } },
    })
    const store = useAlertStore()
    await store.fetchList()
    expect(store.error).toBe('Server said no')
  })
})

// ------- fetchDetails -------

describe('fetchDetails', () => {
  it('sets selectedAlert on success', async () => {
    vi.mocked(AlertService.details).mockResolvedValue(mockDetail)
    const store = useAlertStore()
    await store.fetchDetails('1')
    expect(store.selectedAlert).toEqual(mockDetail)
    expect(store.detailLoading).toBe(false)
  })

  it('sets error on failure', async () => {
    vi.mocked(AlertService.details).mockRejectedValue({ message: 'Not found' })
    const store = useAlertStore()
    await store.fetchDetails('99')
    expect(store.error).toBe('Not found')
  })
})

// ------- acknowledge -------

describe('acknowledge', () => {
  it('marks alert as acknowledged in list', async () => {
    vi.mocked(AlertService.list).mockResolvedValue(mockAlerts)
    vi.mocked(AlertService.acknowledge).mockResolvedValue(undefined)
    const store = useAlertStore()
    await store.fetchList()
    await store.acknowledge('1')
    expect(store.alerts.find((a) => a.id === '1')?.isAcknowledged).toBe(true)
  })

  it('also updates selectedAlert if it matches', async () => {
    vi.mocked(AlertService.details).mockResolvedValue(mockDetail)
    vi.mocked(AlertService.acknowledge).mockResolvedValue(undefined)
    const store = useAlertStore()
    await store.fetchDetails('1')
    await store.acknowledge('1')
    expect(store.selectedAlert?.isAcknowledged).toBe(true)
  })
})

// ------- updateMessage -------

describe('updateMessage', () => {
  it('patches message in list and selectedAlert', async () => {
    vi.mocked(AlertService.list).mockResolvedValue(mockAlerts)
    vi.mocked(AlertService.details).mockResolvedValue(mockDetail)
    vi.mocked(AlertService.updateMessage).mockResolvedValue(undefined as any)
    const store = useAlertStore()
    await store.fetchList()
    await store.fetchDetails('1')
    await store.updateMessage('1', 'Updated message')
    expect(store.alerts.find((a) => a.id === '1')?.message).toBe('Updated message')
    expect(store.selectedAlert?.message).toBe('Updated message')
  })

  it('rethrows error so caller can handle it', async () => {
    vi.mocked(AlertService.updateMessage).mockRejectedValue({ message: 'Failed' })
    const store = useAlertStore()
    await expect(store.updateMessage('1', 'x')).rejects.toBeTruthy()
    expect(store.error).toBe('Failed')
  })
})

// ------- clearSelection -------

describe('clearSelection', () => {
  it('sets selectedAlert to null', async () => {
    vi.mocked(AlertService.details).mockResolvedValue(mockDetail)
    const store = useAlertStore()
    await store.fetchDetails('1')
    store.clearSelection()
    expect(store.selectedAlert).toBeNull()
  })
})