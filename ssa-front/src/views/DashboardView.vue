<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSatelliteStore } from '@/stores/satellite-store'
import { useConjunctionStore } from '@/stores/conjunction-store'
import { useAlertStore } from '@/stores/alert-store'
import { ESatelliteStatus } from '@/domain'
import FleetStatsBar from '@/components/dashboard/FleetStatsBar.vue'
import SatelliteCard from '@/components/dashboard/SatelliteCard.vue'
import SatelliteOrbitViewer from '@/components/satellite/OrbitVisualisation.vue'

const satelliteStore = useSatelliteStore()
const conjunctionStore = useConjunctionStore()
const alertStore = useAlertStore()

const refreshing = ref(false)

const loadAll = async () => {
  await Promise.all([
    satelliteStore.fetchList(),
    conjunctionStore.fetchList(),
    alertStore.fetchList(),
  ])
}

onMounted(loadAll)

const refresh = async () => {
  refreshing.value = true
  await loadAll()
  refreshing.value = false
}

// Fleet-level stats
const activeSatellites = computed(() =>
  satelliteStore.satellites.filter((s) => s.status === ESatelliteStatus.Active).length,
)

const highRiskConjunctions = computed(() =>
  conjunctionStore.conjunctions.filter((c) => c.isHighRisk).length,
)

// Per-satellite conjunction and alert counts
const conjunctionCountFor = (satId: string) =>
  conjunctionStore.conjunctions.filter(
    (c) => c.primaryObjectId === satId || c.secondaryObjectId === satId,
  ).length

const alertCountFor = (satId: string) => {
  const satConjunctionIds = new Set(
    conjunctionStore.conjunctions
      .filter((c) => c.primaryObjectId === satId || c.secondaryObjectId === satId)
      .map((c) => c.id),
  )
  return alertStore.alerts.filter(
    (a) => a.hasConjunctionEvent && satConjunctionIds.has(a.conjunctionEventId),
  ).length
}

const loading = computed(
  () => satelliteStore.loading || conjunctionStore.loading || alertStore.loading,
)
</script>

<template>
  <div class="dashboard">
    <!-- Top bar -->
    <div class="dashboard-topbar">
      <div class="topbar-left">
        <h2 class="section-heading">Fleet Overview</h2>
        <span class="satellite-count">{{ satelliteStore.satellites.length }} satellites</span>
      </div>
      <button class="refresh-btn" :disabled="refreshing" @click="refresh" title="Refresh all data">
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          :class="{ spinning: refreshing }"
        >
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Stats bar -->
    <FleetStatsBar
      :total-satellites="satelliteStore.satellites.length"
      :active-satellites="activeSatellites"
      :high-risk-conjunctions="highRiskConjunctions"
      :unacknowledged-alerts="alertStore.unacknowledgedCount"
    />

    <!-- Orbit visualisation (top of page, above satellite list) -->
    <SatelliteOrbitViewer
      v-if="satelliteStore.satellites.length > 0"
      :satellites="satelliteStore.satellites.filter(s => s.status === ESatelliteStatus.Active)"
      :earth-radius-km="6371"
      height="520px"
    />

    <!-- Satellite grid -->
    <div v-if="loading && satelliteStore.satellites.length === 0" class="skeleton-grid">
      <div class="skeleton-card" v-for="i in 6" :key="i" />
    </div>

    <div v-else-if="satelliteStore.satellites.length === 0" class="empty-fleet">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
      <h3>No satellites registered</h3>
      <p>Hover the left edge to open the sidebar and manage your fleet.</p>
    </div>

    <div v-else class="satellite-grid">
      <SatelliteCard
        v-for="sat in satelliteStore.satellites"
        :key="sat.id"
        :satellite="sat"
        :conjunction-count="conjunctionCountFor(sat.id)"
        :alert-count="alertCountFor(sat.id)"
      />
    </div>

    <!-- Error states -->
    <div v-if="satelliteStore.error" class="error-banner">
      {{ satelliteStore.error }}
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100%;
}

/* Top bar */
.dashboard-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.topbar-left {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.section-heading {
  font-size: 1.2rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
}

.satellite-count {
  font-size: 0.8rem;
  color: #475569;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 7px;
  border: 1px solid #1a2d4a;
  background: transparent;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.refresh-btn:hover:not(:disabled) {
  color: #94a3b8;
  border-color: #2a4a6c;
  background: rgba(255,255,255,0.03);
}

.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.spinning { animation: spin 1s linear infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Satellite grid */
.satellite-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

/* Skeleton grid */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  height: 220px;
  border-radius: 12px;
  background: linear-gradient(90deg, #0d1a2d 25%, #1a2d4a 50%, #0d1a2d 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty fleet */
.empty-fleet {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: #1e3a5c;
  text-align: center;
}

.empty-fleet h3 { font-size: 1.1rem; font-weight: 600; color: #334155; margin: 0; }
.empty-fleet p  { font-size: 0.85rem; color: #1e3a5c; max-width: 320px; margin: 0; }

/* Error */
.error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  color: #f87171;
  font-size: 0.82rem;
  padding: 0.75rem 1rem;
}
</style>
