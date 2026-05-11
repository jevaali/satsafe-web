import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import SatelliteView from '@/views/SatelliteView.vue'
import { useSatelliteStore } from '@/stores/satellite-store'
import { useConjunctionStore } from '@/stores/conjunction-store'
import { useAlertStore } from '@/stores/alert-store'
import { ESatelliteStatus } from '@/domain'
import type { ISatelliteDetail, ISatelliteListItem } from '@/domain'

vi.mock('@/components/satellite/OrbitVisualisation.vue', () => ({
  default: { template: '<div data-testid="orbit-vis" />' },
}))
vi.mock('@/components/satellite/SatelliteHero.vue', () => ({
  default: {
    emits: ['edit', 'delete'],
    template: `<div data-testid="satellite-hero">
      <button data-testid="edit-btn"   @click="$emit('edit')" />
      <button data-testid="delete-btn" @click="$emit('delete')" />
    </div>`,
  },
}))
vi.mock('@/components/satellite/OrbitPanel.vue', () => ({
  default: { template: '<div data-testid="orbit-panel" />' },
}))
vi.mock('@/components/satellite/RiskPanel.vue', () => ({
  default: { template: '<div data-testid="risk-panel" />' },
}))
vi.mock('@/components/satellite/ConjunctionsPanel.vue', () => ({
  default: {
    props: ['conjunctions', 'satelliteId', 'loading'],
    template: '<div data-testid="conjunctions-panel" :data-count="conjunctions.length" />',
  },
}))
vi.mock('@/components/satellite/AlertsPanel.vue', () => ({
  default: {
    props: ['alerts', 'loading', 'actionLoading'],
    emits: ['acknowledge'],
    template: '<div data-testid="alerts-panel" :data-count="alerts.length" />',
  },
}))
vi.mock('@/components/satellite/SatelliteFormModal.vue', () => ({
  default: {
    props: ['open', 'mode', 'editTarget'],
    emits: ['close'],
    template: '<div data-testid="satellite-modal" :data-open="String(open)" />',
  },
}))
vi.mock('@/components/satellite/TlePanel.vue', () => ({
  default: { template: '<div data-testid="tle-panel" />' },
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { id: 'sat-1' } })),
  useRouter: vi.fn(() => ({ push: mockPush })),
}))

const mockSatelliteDetail: ISatelliteDetail = {
  id: 'sat-1',
  name: 'Alpha',
  noradId: 12345,
  launchDate: '2020-01-01',
  status: ESatelliteStatus.Active,
  orbit: { semiMajorAxis: 7000, eccentricity: 0.001, inclination: 51.6, raan: 0, argumentOfPerigee: 0, meanAnomaly: 0 },
  riskAssessment: { riskScore: 0.3, riskLevel: 'LOW', modelVersion: '1.0', calculatedAt: '2024-01-01' },
}

const mockSatelliteListItem: ISatelliteListItem = {
  id: 'sat-1', name: 'Alpha', noradId: 12345, launchDate: '2020-01-01',
  status: ESatelliteStatus.Active, riskLevel: 'LOW',
  orbit: mockSatelliteDetail.orbit,
}

const mockConjunctions = [
  { id: 'conj-1', primaryObjectId: 'sat-1', secondaryObjectId: 'sat-2', isHighRisk: true },
  { id: 'conj-2', primaryObjectId: 'sat-3', secondaryObjectId: 'sat-1', isHighRisk: false },
  { id: 'conj-3', primaryObjectId: 'sat-2', secondaryObjectId: 'sat-3', isHighRisk: false }, // unrelated
]

const mockAlerts = [
  { id: 'alert-1', hasConjunctionEvent: true,  conjunctionEventId: 'conj-1', isAcknowledged: false },
  { id: 'alert-2', hasConjunctionEvent: true,  conjunctionEventId: 'conj-2', isAcknowledged: false },
  { id: 'alert-3', hasConjunctionEvent: false, conjunctionEventId: '',        isAcknowledged: false }, // no conjunction link
  { id: 'alert-4', hasConjunctionEvent: true,  conjunctionEventId: 'conj-3', isAcknowledged: false }, // unrelated conjunction
]

function mountComponent(overrides: {
  satellites?: Record<string, unknown>
  conjunctions?: Record<string, unknown>
  alerts?: Record<string, unknown>
} = {}) {
  return mount(SatelliteView, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            satellites: {
              satellites: [],
              selectedSatellite: mockSatelliteDetail,
              detailLoading: false,
              riskLoading: false,
              error: null,
              ...overrides.satellites,
            },
            conjunctions: { conjunctions: mockConjunctions, loading: false, ...overrides.conjunctions },
            alerts: { alerts: mockAlerts, loading: false, actionLoading: false, ...overrides.alerts },
          },
        }),
      ],
      stubs: { Teleport: { template: '<slot />' } },
    },
  })
}

describe('SatelliteView', () => {

  beforeEach(() => {
    mockPush.mockClear()
  })

  describe('on mount', () => {
    it('fetches details, conjunctions, and alerts', () => {
      mountComponent()
      expect(useSatelliteStore().fetchDetails).toHaveBeenCalledWith('sat-1')
      expect(useConjunctionStore().fetchList).toHaveBeenCalledOnce()
      expect(useAlertStore().fetchList).toHaveBeenCalledOnce()
    })

    it('fetches satellite list when it is empty', () => {
      mountComponent({ satellites: { satellites: [] } })
      expect(useSatelliteStore().fetchList).toHaveBeenCalledOnce()
    })

    it('skips satellite list fetch when already populated', () => {
      mountComponent({ satellites: { satellites: [mockSatelliteListItem] } })
      expect(useSatelliteStore().fetchList).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('shows skeleton UI while detail is loading', () => {
      const wrapper = mountComponent({ satellites: { detailLoading: true, selectedSatellite: null } })
      expect(wrapper.find('.skeleton-hero').exists()).toBe(true)
      expect(wrapper.findAll('.skeleton-panel')).toHaveLength(4)
    })

    it('hides skeleton once loaded', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.skeleton-hero').exists()).toBe(false)
    })
  })

  describe('error state', () => {
    it('shows error message when fetch failed and no satellite is present', () => {
      const wrapper = mountComponent({ satellites: { selectedSatellite: null, error: 'Not found' } })
      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.find('.error-state').text()).toContain('Not found')
    })

    it('suppresses error state when satellite is already loaded', () => {
      const wrapper = mountComponent({ satellites: { error: 'stale error' } })
      expect(wrapper.find('.error-state').exists()).toBe(false)
    })

    it('navigates to / when the back button is clicked', async () => {
      const wrapper = mountComponent({ satellites: { selectedSatellite: null, error: 'Not found' } })
      await wrapper.find('.back-btn').trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('main content', () => {
    it('renders all panels when satellite data is available', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="satellite-hero"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="orbit-panel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="risk-panel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="conjunctions-panel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="alerts-panel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="tle-panel"]').exists()).toBe(true)
    })
  })

  describe('satelliteConjunctions', () => {
    it('passes only conjunctions where this satellite is primary or secondary', () => {
      const wrapper = mountComponent()
      // conj-1 (primary sat-1) + conj-2 (secondary sat-1) = 2; conj-3 is unrelated
      expect(wrapper.find('[data-testid="conjunctions-panel"]').attributes('data-count')).toBe('2')
    })
  })

  describe('satelliteAlerts', () => {
    it('passes only alerts linked to this satellite\'s conjunctions', () => {
      const wrapper = mountComponent()
      // alert-1 → conj-1, alert-2 → conj-2 — both belong to sat-1
      // alert-3 has no conjunction link, alert-4 is for unrelated conj-3
      expect(wrapper.find('[data-testid="alerts-panel"]').attributes('data-count')).toBe('2')
    })
  })

  describe('delete flow', () => {
    it('opens the confirm dialog when delete is triggered', async () => {
      const wrapper = mountComponent()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      expect(wrapper.find('.confirm-dialog').exists()).toBe(true)
    })

    it('closes the confirm dialog when cancel is clicked', async () => {
      const wrapper = mountComponent()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      await wrapper.find('.btn-cancel').trigger('click')
      expect(wrapper.find('.confirm-dialog').exists()).toBe(false)
    })

    it('calls remove with the satellite id on confirm', async () => {
      const wrapper = mountComponent()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      await wrapper.find('.btn-danger').trigger('click')
      await flushPromises()
      expect(useSatelliteStore().remove).toHaveBeenCalledWith('sat-1')
    })

    it('navigates to / after successful delete', async () => {
      const wrapper = mountComponent()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      await wrapper.find('.btn-danger').trigger('click')
      await flushPromises()
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('disables the delete button while delete is in progress', async () => {
      const wrapper = mountComponent()
      useSatelliteStore().remove = vi.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)))
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      await wrapper.find('.btn-danger').trigger('click')
      await nextTick()
      expect(wrapper.find('.btn-danger').element.hasAttribute('disabled')).toBe(true)
    })
  })

  describe('edit flow', () => {
    it('opens the modal when edit is triggered', async () => {
      const wrapper = mountComponent()
      await wrapper.find('[data-testid="edit-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="satellite-modal"]').attributes('data-open')).toBe('true')
    })

    it('modal is closed by default', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="satellite-modal"]').attributes('data-open')).toBe('false')
    })
  })
})
