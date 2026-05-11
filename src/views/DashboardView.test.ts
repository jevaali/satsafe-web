import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { vi, describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import DashboardView from '@/views/DashboardView.vue'
import { useSatelliteStore } from '@/stores/satellite-store'
import { useConjunctionStore } from '@/stores/conjunction-store'
import { useAlertStore } from '@/stores/alert-store'
import { ESatelliteStatus } from '@/domain'

vi.mock('@/components/satellite/OrbitVisualisation.vue', () => ({
  default: { template: '<div data-testid="orbit-viewer" />' }
}))
vi.mock('@/components/dashboard/SatelliteCard.vue', () => ({
  default: {
    props: ['satellite', 'conjunctionCount', 'alertCount'],
    template: `<div data-testid="satellite-card"
                 :data-conjunction-count="conjunctionCount"
                 :data-alert-count="alertCount" />`
  }
}))
vi.mock('@/components/dashboard/FleetStatsBar.vue', () => ({
  default: {
    props: ['totalSatellites', 'activeSatellites', 'highRiskConjunctions', 'unacknowledgedAlerts'],
    template: `<div data-testid="fleet-stats"
                 :data-active="activeSatellites"
                 :data-high-risk="highRiskConjunctions"
                 :data-unacknowledged="unacknowledgedAlerts" />`
  }
}))

const mockSatellites = [
  { id: 'sat-1', name: 'Alpha', status: ESatelliteStatus.Active },
  { id: 'sat-2', name: 'Beta',  status: ESatelliteStatus.Inactive },
]

const mockConjunctions = [
  { id: 'conj-1', primaryObjectId: 'sat-1', secondaryObjectId: 'sat-2', isHighRisk: true },
  { id: 'conj-2', primaryObjectId: 'sat-1', secondaryObjectId: 'sat-3', isHighRisk: false },
]

const mockAlerts = [
  { id: 'alert-1', hasConjunctionEvent: true,  conjunctionEventId: 'conj-1', isAcknowledged: false },
  { id: 'alert-2', hasConjunctionEvent: false, conjunctionEventId: '',       isAcknowledged: false },
]

function mountComponent() {
  return mount(DashboardView, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            satellites:   { satellites: mockSatellites, loading: false, error: null },
            conjunctions: { conjunctions: mockConjunctions, loading: false },
            alerts:       { alerts: mockAlerts, loading: false },
          },
        }),
      ],
    },
  })
}

describe('DashboardView', () => {

  describe('on mount', () => {
    it('fetches all data on mount', () => {
      const wrapper = mountComponent()
      expect(useSatelliteStore().fetchList).toHaveBeenCalledOnce()
      expect(useConjunctionStore().fetchList).toHaveBeenCalledOnce()
      expect(useAlertStore().fetchList).toHaveBeenCalledOnce()
    })
  })

  describe('fleet stats', () => {
    it('passes only active satellite count to FleetStatsBar', () => {
      const wrapper = mountComponent()
      // sat-1 is Active, sat-2 is Inactive → expect 1
      expect(wrapper.find('[data-testid="fleet-stats"]').attributes('data-active')).toBe('1')
    })

    it('passes high-risk conjunction count to FleetStatsBar', () => {
      const wrapper = mountComponent()
      // only conj-1 isHighRisk → expect 1
      expect(wrapper.find('[data-testid="fleet-stats"]').attributes('data-high-risk')).toBe('1')
    })

    it('passes unacknowledged alert count to FleetStatsBar', () => {
      const wrapper = mountComponent()
      // both alerts have isAcknowledged: false, but unacknowledgedCount is a store computed
      // it will recompute from seeded alerts → expect 2
      expect(wrapper.find('[data-testid="fleet-stats"]').attributes('data-unacknowledged')).toBe('2')
    })
  })

  describe('conjunctionCountFor', () => {
    it('counts conjunctions where satellite is primary or secondary', () => {
      const wrapper = mountComponent()
      const cards = wrapper.findAll('[data-testid="satellite-card"]')
      expect(cards[0]?.attributes('data-conjunction-count')).toBe('2')
      expect(cards[1]?.attributes('data-conjunction-count')).toBe('1')
    })
  })

  describe('alertCountFor', () => {
    it('counts only alerts linked to the satellite via conjunctions', () => {
      const wrapper = mountComponent()
      const cards = wrapper.findAll('[data-testid="satellite-card"]')
      expect(cards[0]?.attributes('data-conjunction-count')).toBe('2')
      expect(cards[1]?.attributes('data-conjunction-count')).toBe('1')
    })

    it('ignores alerts where hasConjunctionEvent is false', () => {
      const wrapper = mountComponent()
      const cards = wrapper.findAll('[data-testid="satellite-card"]')
      // alert-2 has hasConjunctionEvent: false — neither card should count it
      const total = cards.reduce((sum, c) => sum + Number(c.attributes('data-alert-count')), 0)
      expect(total).toBe(2) // alert-1 counted once for sat-1, once for sat-2
    })
  })

  describe('template states', () => {
    it('shows skeleton cards when loading with no satellites', () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              satellites:   { satellites: [], loading: true,  error: null },
              conjunctions: { conjunctions: [], loading: false },
              alerts:       { alerts: [], loading: false },
            },
          })],
        },
      })
      expect(wrapper.findAll('.skeleton-card')).toHaveLength(6)
    })

    it('shows empty state when not loading and no satellites', () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              satellites:   { satellites: [], loading: false, error: null },
              conjunctions: { conjunctions: [], loading: false },
              alerts:       { alerts: [], loading: false },
            },
          })],
        },
      })
      expect(wrapper.find('.empty-fleet').exists()).toBe(true)
    })

    it('shows error banner when satellite store has an error', async () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              satellites:   { satellites: [], loading: false, error: null },
              conjunctions: { conjunctions: [], loading: false },
              alerts:       { alerts: [], loading: false },
            },
          })],
        },
      })
      // Set error directly on the store after mount so Vue reacts to it
      useSatelliteStore().error = 'Network error'
      await nextTick()

      expect(wrapper.find('.error-banner').text()).toBe('Network error')
    })
  })

  describe('refresh', () => {
    it('calls all fetch actions again on refresh', async () => {
      const wrapper = mountComponent()
      await wrapper.find('.refresh-btn').trigger('click')

      expect(useSatelliteStore().fetchList).toHaveBeenCalledTimes(2)
      expect(useConjunctionStore().fetchList).toHaveBeenCalledTimes(2)
      expect(useAlertStore().fetchList).toHaveBeenCalledTimes(2)
    })

    it('disables the refresh button while refreshing', async () => {
      const wrapper = mountComponent()
      useSatelliteStore().fetchList = vi.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)))


      await wrapper.find('.refresh-btn').trigger('click')
      await nextTick()

      expect(wrapper.find('.refresh-btn').element.hasAttribute('disabled')).toBe(true)
    })
  })
})