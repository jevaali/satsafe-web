// src/components/satellite/SatelliteCard.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import SatelliteCard from './SatelliteCard.vue'
import { ESatelliteStatus } from '@/domain'
import type { ISatelliteListItem } from '@/domain'

// Stub child components so we test SatelliteCard in isolation
const stubs = {
  StatusBadge: { template: '<span data-testid="status-badge" />' },
  RiskBadge: { template: '<span data-testid="risk-badge" />' },
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/satellites/:id', component: { template: '<div />' } },
  ],
})

const mockSatellite: ISatelliteListItem = {
  id: 'sat-1',
  name: 'SAT-A',
  noradId: 12345,
  launchDate: '2020-06-15',
  status: ESatelliteStatus.Active,
  riskLevel: 'Low',
  orbit: {
    semiMajorAxis: 6771,   // ~400km altitude
    eccentricity: 0.0012,
    inclination: 51.6,
    raan: 100.0,
    argumentOfPerigee: 90.0,
    meanAnomaly: 45.0,
  },
}

const mountCard = (overrides: Partial<ISatelliteListItem> = {}, conjunctionCount = 0, alertCount = 0) => {
  return mount(SatelliteCard, {
    props: {
      satellite: { ...mockSatellite, ...overrides },
      conjunctionCount,
      alertCount,
    },
    global: {
      plugins: [router, createTestingPinia()],
      stubs,
    },
  })
}

beforeEach(async () => {
  await router.push('/')
  await router.isReady()
})

// ------- rendering -------

describe('rendering', () => {
  it('displays satellite name', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('SAT-A')
  })

  it('displays NORAD id', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('12345')
  })

  it('displays launch year', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('2020')
  })

  it('displays altitude computed from semiMajorAxis', () => {
    const wrapper = mountCard()
    // 6771 - 6371 = 400
    expect(wrapper.text()).toContain('400')
  })

  it('displays inclination with 1 decimal place', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('51.6°')
  })

  it('displays eccentricity with 4 decimal places', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('0.0012')
  })

  it('renders StatusBadge and RiskBadge', () => {
    const wrapper = mountCard()
    expect(wrapper.find('[data-testid="status-badge"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="risk-badge"]').exists()).toBe(true)
  })

  it('hides launch year if launchDate is missing', () => {
    const wrapper = mountCard({ launchDate: '' })
    expect(wrapper.text()).not.toContain('Since')
  })
})

// ------- conjunction / alert counters -------

describe('counters', () => {
  it('shows singular conjunction label', () => {
    const wrapper = mountCard({}, 1, 0)
    expect(wrapper.text()).toContain('1 conjunction')
  })

  it('shows plural conjunctions label', () => {
    const wrapper = mountCard({}, 3, 0)
    expect(wrapper.text()).toContain('3 conjunctions')
  })

  it('shows singular alert label', () => {
    const wrapper = mountCard({}, 0, 1)
    expect(wrapper.text()).toContain('1 alert')
  })

  it('shows plural alerts label', () => {
    const wrapper = mountCard({}, 0, 2)
    expect(wrapper.text()).toContain('2 alerts')
  })

    it('applies warn class when conjunctionCount > 0', () => {
    const wrapper = mountCard({}, 2, 0)
    expect(wrapper.find('.counter--warn').exists()).toBe(true)
    })

    it('does not apply warn class when conjunctionCount is 0', () => {
    const wrapper = mountCard({}, 0, 0)
    expect(wrapper.find('.counter--warn').exists()).toBe(false)
    })

    it('applies danger class when alertCount > 0', () => {
    const wrapper = mountCard({}, 0, 3)
    expect(wrapper.find('.counter--danger').exists()).toBe(true)
    })
})

// ------- active class -------

describe('active state', () => {
  it('adds sat-card--active class when status is Active', () => {
    const wrapper = mountCard({ status: ESatelliteStatus.Active })
    expect(wrapper.find('.sat-card').classes()).toContain('sat-card--active')
  })

  it('does not add sat-card--active class for inactive satellite', () => {
    const wrapper = mountCard({ status: ESatelliteStatus.Inactive })
    expect(wrapper.find('.sat-card').classes()).not.toContain('sat-card--active')
  })
})

// ------- navigation -------

describe('navigation', () => {
    it('navigates to satellite detail page on click', async () => {
    const wrapper = mountCard()
    await wrapper.find('.sat-card').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/satellites/sat-1')
    })
})