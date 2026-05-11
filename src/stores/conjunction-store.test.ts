// src/stores/conjunction-store.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useConjunctionStore } from './conjunction-store'
import { ConjunctionService } from '../services/api-services/ConjunctionService'
import type { IConjunctionListItem, IConjunctionDetail } from '../domain/IConjunction'
import {
  EOperatorAcknowledgement,
  EConjunctionEventStatus,
  ESatelliteStatus,
} from '../domain/IConjunction'
import { EAlertSeverity } from '../domain/IAlert'

vi.mock('../services/api-services/ConjunctionService')

const mockOrbit = {
  semiMajorAxis: 6778,
  eccentricity: 0.001,
  inclination: 51.6,
  raan: 100.0,
  argumentOfPerigee: 90.0,
  meanAnomaly: 45.0,
}

const mockConjunctions: IConjunctionListItem[] = [
  {
    id: 'conj-1',
    isHighRisk: true,
    timeOfClosestApproach: '2024-01-01T12:00:00Z',
    primaryObjectId: 'obj-1',
    secondaryObjectId: 'obj-2',
    primaryObjectName: 'SAT-A',
    secondaryObjectName: 'SAT-B',
    missDistance: 100,
    collisionProbability: 0.005,
    status: EConjunctionEventStatus.Potential,
  },
  {
    id: 'conj-2',
    isHighRisk: false,
    timeOfClosestApproach: '2024-01-02T12:00:00Z',
    primaryObjectId: 'obj-3',
    secondaryObjectId: 'obj-4',
    primaryObjectName: 'SAT-C',
    secondaryObjectName: 'SAT-D',
    missDistance: 500,
    collisionProbability: 0.0001,
    status: EConjunctionEventStatus.Resolved,
  },
]

const mockDetail: IConjunctionDetail = {
  id: 'conj-1',
  isHighRisk: true,
  timeOfClosestApproach: '2024-01-01T12:00:00Z',
  primaryObjectId: 'obj-1',
  secondaryObjectId: 'obj-2',
  primaryObjectName: 'SAT-A',
  secondaryObjectName: 'SAT-B',
  missDistance: 100,
  collisionProbability: 0.005,
  status: EConjunctionEventStatus.Potential,
  primaryAcknowledgement: EOperatorAcknowledgement.None,
  secondaryAcknowledgement: EOperatorAcknowledgement.None,
  operatorSide: 'primary',
  primaryIsSatellite: true,
  secondaryIsSatellite: false,
  primaryNoradId: 12345,
  secondaryNoradId: 67890,
  primaryObjectStatus: ESatelliteStatus.Active,
  secondaryObjectStatus: ESatelliteStatus.Inactive,
  primaryOrbit: mockOrbit,
  secondaryOrbit: mockOrbit,
  alerts: [
    {
      id: 'alert-1',
      isAcknowledged: false,
      createdAt: '2024-01-01T00:00:00Z',
      severity: EAlertSeverity.High,
      message: 'High risk conjunction detected',
      conjunctionEventId: 'conj-1',
      hasConjunctionEvent: true,
    },
  ],
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ------- computed -------

describe('computed', () => {
  it('count returns total number of conjunctions', async () => {
    vi.mocked(ConjunctionService.list).mockResolvedValue(mockConjunctions)
    const store = useConjunctionStore()
    await store.fetchList()
    expect(store.count).toBe(2)
  })

  it('highRiskCount only counts high risk conjunctions', async () => {
    vi.mocked(ConjunctionService.list).mockResolvedValue(mockConjunctions)
    const store = useConjunctionStore()
    await store.fetchList()
    expect(store.highRiskCount).toBe(1)
  })
})

// ------- fetchList -------

describe('fetchList', () => {
  it('populates conjunctions on success', async () => {
    vi.mocked(ConjunctionService.list).mockResolvedValue(mockConjunctions)
    const store = useConjunctionStore()
    await store.fetchList()
    expect(store.conjunctions).toEqual(mockConjunctions)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('sets error on failure', async () => {
    vi.mocked(ConjunctionService.list).mockRejectedValue({ message: 'Network error' })
    const store = useConjunctionStore()
    await store.fetchList()
    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })

  it('prefers response.data.messages over generic message', async () => {
    vi.mocked(ConjunctionService.list).mockRejectedValue({
      response: { data: { messages: ['Server said no'] } },
    })
    const store = useConjunctionStore()
    await store.fetchList()
    expect(store.error).toBe('Server said no')
  })

  it('falls back to default message if no error info', async () => {
    vi.mocked(ConjunctionService.list).mockRejectedValue({})
    const store = useConjunctionStore()
    await store.fetchList()
    expect(store.error).toBe('Failed to load conjunctions')
  })
})

// ------- fetchDetails -------

describe('fetchDetails', () => {
  it('sets selectedConjunction on success', async () => {
    vi.mocked(ConjunctionService.details).mockResolvedValue(mockDetail)
    const store = useConjunctionStore()
    await store.fetchDetails('conj-1')
    expect(store.selectedConjunction).toEqual(mockDetail)
    expect(store.detailLoading).toBe(false)
  })

  it('sets error on failure', async () => {
    vi.mocked(ConjunctionService.details).mockRejectedValue({ message: 'Not found' })
    const store = useConjunctionStore()
    await store.fetchDetails('bad-id')
    expect(store.error).toBe('Not found')
    expect(store.detailLoading).toBe(false)
  })

  it('falls back to default message if no error info', async () => {
    vi.mocked(ConjunctionService.details).mockRejectedValue({})
    const store = useConjunctionStore()
    await store.fetchDetails('bad-id')
    expect(store.error).toBe('Failed to load conjunction')
  })
})

// ------- acknowledge -------

describe('acknowledge', () => {
  it('sets primaryAcknowledgement to Confirmed when operatorSide is primary', async () => {
    vi.mocked(ConjunctionService.details).mockResolvedValue({
      ...mockDetail,
      operatorSide: 'primary',
    })
    vi.mocked(ConjunctionService.acknowledge).mockImplementation(() => Promise.resolve())
    const store = useConjunctionStore()
    await store.fetchDetails('conj-1')
    await store.acknowledge('conj-1')
    expect(store.selectedConjunction?.primaryAcknowledgement).toBe(EOperatorAcknowledgement.Confirmed)
    expect(store.acknowledgeLoading).toBe(false)
  })

  it('sets secondaryAcknowledgement to Confirmed when operatorSide is secondary', async () => {
    vi.mocked(ConjunctionService.details).mockResolvedValue({
      ...mockDetail,
      operatorSide: 'secondary',
      secondaryAcknowledgement: EOperatorAcknowledgement.None,
    })
    vi.mocked(ConjunctionService.acknowledge).mockImplementation(() => Promise.resolve())
    const store = useConjunctionStore()
    await store.fetchDetails('conj-1')
    await store.acknowledge('conj-1')
    expect(store.selectedConjunction?.secondaryAcknowledgement).toBe(EOperatorAcknowledgement.Confirmed)
  })

  it('does not patch if selectedConjunction id does not match', async () => {
    vi.mocked(ConjunctionService.details).mockResolvedValue(mockDetail)
    vi.mocked(ConjunctionService.acknowledge).mockImplementation(() => Promise.resolve())
    const store = useConjunctionStore()
    await store.fetchDetails('conj-1')
    await store.acknowledge('conj-999')  // different id
    expect(store.selectedConjunction?.primaryAcknowledgement).toBe(EOperatorAcknowledgement.None)
  })

  it('sets error on failure', async () => {
    vi.mocked(ConjunctionService.details).mockResolvedValue(mockDetail)
    vi.mocked(ConjunctionService.acknowledge).mockRejectedValue({ message: 'Acknowledge failed' })
    const store = useConjunctionStore()
    await store.fetchDetails('conj-1')
    await store.acknowledge('conj-1')
    expect(store.error).toBe('Acknowledge failed')
    expect(store.acknowledgeLoading).toBe(false)
  })
})

// ------- clearSelection -------

describe('clearSelection', () => {
  it('sets selectedConjunction to null', async () => {
    vi.mocked(ConjunctionService.details).mockResolvedValue(mockDetail)
    const store = useConjunctionStore()
    await store.fetchDetails('conj-1')
    store.clearSelection()
    expect(store.selectedConjunction).toBeNull()
  })
})