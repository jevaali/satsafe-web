// src/stores/dashboard-store.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useDashboardStore } from './dashboard-store'
import { DashboardService } from '../services/api-services/DashboardService'
import type { IDashboard } from '../domain/IDashboard'
import { EConjunctionEventStatus } from '../domain/IDashboard'
import { ESatelliteStatus } from '../domain/ISatellite'
import { EAlertSeverity } from '../domain/IAlert'

vi.mock('../services/api-services/DashboardService')

const mockOrbit = {
  semiMajorAxis: 6778,
  eccentricity: 0.001,
  inclination: 51.6,
  raan: 100.0,
  argumentOfPerigee: 90.0,
  meanAnomaly: 45.0,
}

const mockDashboard: IDashboard = {
  operatorName: 'AcmeCorp',
  totalSatellites: 3,
  activeSatellites: 2,
  pendingConjunctions: 1,
  highRiskConjunctions: 1,
  unacknowledgedAlerts: 2,
  satellites: [
    {
      id: 'sat-1',
      name: 'SAT-A',
      noradId: 12345,
      launchDate: '2022-01-01',
      status: ESatelliteStatus.Active,
      riskLevel: 'Low',
      orbit: mockOrbit,
    },
    {
      id: 'sat-2',
      name: 'SAT-B',
      noradId: 67890,
      launchDate: '2021-06-15',
      status: ESatelliteStatus.Inactive,
      riskLevel: 'Medium',
      orbit: mockOrbit,
    },
  ],
  conjunctions: [
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
  ],
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
    {
      id: 'alert-2',
      isAcknowledged: false,
      createdAt: '2024-01-02T00:00:00Z',
      severity: EAlertSeverity.Medium,
      message: 'Conjunction approaching',
      conjunctionEventId: 'conj-1',
      hasConjunctionEvent: true,
    },
  ],
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ------- fetch -------

describe('fetch', () => {
  it('populates data on success', async () => {
    vi.mocked(DashboardService.get).mockResolvedValue(mockDashboard)
    const store = useDashboardStore()
    await store.fetch()
    expect(store.data).toEqual(mockDashboard)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('sets error on failure', async () => {
    vi.mocked(DashboardService.get).mockRejectedValue({ message: 'Network error' })
    const store = useDashboardStore()
    await store.fetch()
    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
    expect(store.data).toBeNull()
  })

  it('prefers response.data.messages over generic message', async () => {
    vi.mocked(DashboardService.get).mockRejectedValue({
      response: { data: { messages: ['Server said no'] } },
    })
    const store = useDashboardStore()
    await store.fetch()
    expect(store.error).toBe('Server said no')
  })

  it('falls back to default message if no error info', async () => {
    vi.mocked(DashboardService.get).mockRejectedValue({})
    const store = useDashboardStore()
    await store.fetch()
    expect(store.error).toBe('Failed to load dashboard')
  })

  it('resets error before each fetch', async () => {
    vi.mocked(DashboardService.get).mockRejectedValueOnce({ message: 'First error' })
    vi.mocked(DashboardService.get).mockResolvedValueOnce(mockDashboard)
    const store = useDashboardStore()
    await store.fetch()
    expect(store.error).toBe('First error')
    await store.fetch()
    expect(store.error).toBeNull()
  })

  it('sets loading to true during fetch then false after', async () => {
    let resolveFetch!: (value: IDashboard) => void
    vi.mocked(DashboardService.get).mockReturnValue(
      new Promise((res) => { resolveFetch = res })
    )
    const store = useDashboardStore()
    const fetchPromise = store.fetch()
    expect(store.loading).toBe(true)
    resolveFetch(mockDashboard)
    await fetchPromise
    expect(store.loading).toBe(false)
  })
})