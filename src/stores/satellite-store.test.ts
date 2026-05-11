// src/stores/satellite-store.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useSatelliteStore } from './satellite-store'
import { SatelliteService } from '../services/api-services/SatelliteService'
import type {
  ISatelliteListItem,
  ISatelliteDetail,
  ICreateSatellitePayload,
  IUpdateSatellitePayload,
} from '../domain/ISatellite'
import { ESatelliteStatus } from '../domain/ISatellite'

vi.mock('../services/api-services/SatelliteService')

const mockOrbit = {
  semiMajorAxis: 6778,
  eccentricity: 0.001,
  inclination: 51.6,
  raan: 100.0,
  argumentOfPerigee: 90.0,
  meanAnomaly: 45.0,
}

const mockSatellites: ISatelliteListItem[] = [
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
]

const mockDetail: ISatelliteDetail = {
  id: 'sat-1',
  name: 'SAT-A',
  noradId: 12345,
  launchDate: '2022-01-01',
  status: ESatelliteStatus.Active,
  orbit: mockOrbit,
  riskAssessment: {
    riskScore: 0.02,
    riskLevel: 'Low',
    modelVersion: '1.0.0',
    calculatedAt: '2024-01-01T00:00:00Z',
  },
}

const mockCreatePayload: ICreateSatellitePayload = {
  name: 'SAT-NEW',
  launchDate: '2024-01-01',
  operatorId: 'op-1',
  noradId: 99999,
  ...mockOrbit,
}

const mockUpdatePayload: IUpdateSatellitePayload = {
  satelliteId: 'sat-1',
  name: 'SAT-A-UPDATED',
  launchDate: '2022-01-01',
  operatorId: 'op-1',
  noradId: 12345,
  ...mockOrbit,
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ------- computed -------

describe('computed', () => {
  it('count returns number of satellites', async () => {
    vi.mocked(SatelliteService.list).mockResolvedValue(mockSatellites)
    const store = useSatelliteStore()
    await store.fetchList()
    expect(store.count).toBe(2)
  })
})

// ------- fetchList -------

describe('fetchList', () => {
  it('populates satellites on success', async () => {
    vi.mocked(SatelliteService.list).mockResolvedValue(mockSatellites)
    const store = useSatelliteStore()
    await store.fetchList()
    expect(store.satellites).toEqual(mockSatellites)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('sets error on failure', async () => {
    vi.mocked(SatelliteService.list).mockRejectedValue({ message: 'Network error' })
    const store = useSatelliteStore()
    await store.fetchList()
    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })

  it('prefers response.data.messages over generic message', async () => {
    vi.mocked(SatelliteService.list).mockRejectedValue({
      response: { data: { messages: ['Server said no'] } },
    })
    const store = useSatelliteStore()
    await store.fetchList()
    expect(store.error).toBe('Server said no')
  })

  it('falls back to default message if no error info', async () => {
    vi.mocked(SatelliteService.list).mockRejectedValue({})
    const store = useSatelliteStore()
    await store.fetchList()
    expect(store.error).toBe('Failed to load satellites')
  })
})

// ------- fetchDetails -------

describe('fetchDetails', () => {
  it('sets selectedSatellite on success', async () => {
    vi.mocked(SatelliteService.details).mockResolvedValue(mockDetail)
    const store = useSatelliteStore()
    await store.fetchDetails('sat-1')
    expect(store.selectedSatellite).toEqual(mockDetail)
    expect(store.detailLoading).toBe(false)
  })

  it('sets error on failure', async () => {
    vi.mocked(SatelliteService.details).mockRejectedValue({ message: 'Not found' })
    const store = useSatelliteStore()
    await store.fetchDetails('bad-id')
    expect(store.error).toBe('Not found')
    expect(store.detailLoading).toBe(false)
  })

  it('falls back to default message if no error info', async () => {
    vi.mocked(SatelliteService.details).mockRejectedValue({})
    const store = useSatelliteStore()
    await store.fetchDetails('bad-id')
    expect(store.error).toBe('Failed to load satellite')
  })
})

// ------- create -------

describe('create', () => {
  it('returns created satellite and refreshes list', async () => {
    vi.mocked(SatelliteService.create).mockResolvedValue(mockDetail)
    vi.mocked(SatelliteService.list).mockResolvedValue(mockSatellites)
    const store = useSatelliteStore()
    const result = await store.create(mockCreatePayload)
    expect(result).toEqual(mockDetail)
    expect(store.satellites).toEqual(mockSatellites)
  })

  it('throws if service throws', async () => {
    vi.mocked(SatelliteService.create).mockRejectedValue(new Error('Create failed'))
    const store = useSatelliteStore()
    await expect(store.create(mockCreatePayload)).rejects.toThrow('Create failed')
  })
})

// ------- update -------

describe('update', () => {
  it('returns updated satellite and refreshes list', async () => {
    vi.mocked(SatelliteService.update).mockResolvedValue(mockDetail)
    vi.mocked(SatelliteService.list).mockResolvedValue(mockSatellites)
    const store = useSatelliteStore()
    const result = await store.update('sat-1', mockUpdatePayload)
    expect(result).toEqual(mockDetail)
    expect(store.satellites).toEqual(mockSatellites)
  })

  it('also refreshes detail if selectedSatellite matches', async () => {
    vi.mocked(SatelliteService.update).mockResolvedValue(mockDetail)
    vi.mocked(SatelliteService.list).mockResolvedValue(mockSatellites)
    vi.mocked(SatelliteService.details).mockResolvedValue(mockDetail)
    const store = useSatelliteStore()
    store.selectedSatellite = { ...mockDetail, id: 'sat-1' }
    await store.update('sat-1', mockUpdatePayload)
    expect(SatelliteService.details).toHaveBeenCalledWith('sat-1')
  })

  it('does not refresh detail if selectedSatellite does not match', async () => {
    vi.mocked(SatelliteService.update).mockResolvedValue(mockDetail)
    vi.mocked(SatelliteService.list).mockResolvedValue(mockSatellites)
    vi.mocked(SatelliteService.details).mockResolvedValue(mockDetail)
    const store = useSatelliteStore()
    store.selectedSatellite = { ...mockDetail, id: 'sat-2' }
    await store.update('sat-1', mockUpdatePayload)
    expect(SatelliteService.details).not.toHaveBeenCalled()
  })

  it('throws if service throws', async () => {
    vi.mocked(SatelliteService.update).mockRejectedValue(new Error('Update failed'))
    const store = useSatelliteStore()
    await expect(store.update('sat-1', mockUpdatePayload)).rejects.toThrow('Update failed')
  })
})

// ------- remove -------

describe('remove', () => {
  it('removes satellite from list', async () => {
    vi.mocked(SatelliteService.list).mockResolvedValue(mockSatellites)
    vi.mocked(SatelliteService.delete).mockImplementation(() => Promise.resolve())
    const store = useSatelliteStore()
    await store.fetchList()
    await store.remove('sat-1')
    expect(store.satellites.find((s) => s.id === 'sat-1')).toBeUndefined()
    expect(store.satellites).toHaveLength(1)
  })

  it('clears selectedSatellite if it matches removed id', async () => {
    vi.mocked(SatelliteService.delete).mockImplementation(() => Promise.resolve())
    const store = useSatelliteStore()
    store.selectedSatellite = { ...mockDetail, id: 'sat-1' }
    await store.remove('sat-1')
    expect(store.selectedSatellite).toBeNull()
  })

  it('does not clear selectedSatellite if id does not match', async () => {
    vi.mocked(SatelliteService.delete).mockImplementation(() => Promise.resolve())
    const store = useSatelliteStore()
    store.selectedSatellite = { ...mockDetail, id: 'sat-1' }
    await store.remove('sat-2')
    expect(store.selectedSatellite).toEqual({ ...mockDetail, id: 'sat-1' })
  })

  it('throws if service throws', async () => {
    vi.mocked(SatelliteService.delete).mockRejectedValue(new Error('Delete failed'))
    const store = useSatelliteStore()
    await expect(store.remove('sat-1')).rejects.toThrow('Delete failed')
  })
})

// ------- generateRisk -------

describe('generateRisk', () => {
  it('refreshes list after generating risk', async () => {
    vi.mocked(SatelliteService.generateRisk).mockResolvedValue({
      riskScore: 0.02,
      riskLevel: 'Low',
      modelVersion: '1.0.0',
      calculatedAt: '2024-01-01T00:00:00Z',
    })
    vi.mocked(SatelliteService.list).mockResolvedValue(mockSatellites)
    const store = useSatelliteStore()
    await store.generateRisk('sat-1')
    expect(store.satellites).toEqual(mockSatellites)
    expect(store.riskLoading).toBe(false)
  })

  it('also refreshes detail if selectedSatellite matches', async () => {
    vi.mocked(SatelliteService.generateRisk).mockResolvedValue({
      riskScore: 0.02,
      riskLevel: 'Low',
      modelVersion: '1.0.0',
      calculatedAt: '2024-01-01T00:00:00Z',
    })
    vi.mocked(SatelliteService.list).mockResolvedValue(mockSatellites)
    vi.mocked(SatelliteService.details).mockResolvedValue(mockDetail)
    const store = useSatelliteStore()
    store.selectedSatellite = { ...mockDetail, id: 'sat-1' }
    await store.generateRisk('sat-1')
    expect(SatelliteService.details).toHaveBeenCalledWith('sat-1')
  })

  it('does not refresh detail if selectedSatellite does not match', async () => {
    vi.mocked(SatelliteService.generateRisk).mockResolvedValue({
      riskScore: 0.02,
      riskLevel: 'Low',
      modelVersion: '1.0.0',
      calculatedAt: '2024-01-01T00:00:00Z',
    })
    vi.mocked(SatelliteService.list).mockResolvedValue(mockSatellites)
    vi.mocked(SatelliteService.details).mockResolvedValue(mockDetail)
    const store = useSatelliteStore()
    store.selectedSatellite = { ...mockDetail, id: 'sat-2' }
    await store.generateRisk('sat-1')
    expect(SatelliteService.details).not.toHaveBeenCalled()
  })

  it('sets riskLoading to false even if service throws', async () => {
    vi.mocked(SatelliteService.generateRisk).mockRejectedValue(new Error('Risk failed'))
    const store = useSatelliteStore()
    await expect(store.generateRisk('sat-1')).rejects.toThrow('Risk failed')
    expect(store.riskLoading).toBe(false)
  })
})

// ------- clearSelection -------

describe('clearSelection', () => {
  it('sets selectedSatellite to null', async () => {
    const store = useSatelliteStore()
    store.selectedSatellite = mockDetail
    store.clearSelection()
    expect(store.selectedSatellite).toBeNull()
  })
})