<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ISatelliteListItem } from '@/domain'
import { ESatelliteStatus } from '@/domain'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import RiskBadge from '@/components/shared/RiskBadge.vue'

const props = defineProps<{
  satellite: ISatelliteListItem
  conjunctionCount: number
  alertCount: number
}>()

const router = useRouter()

const navigate = () => router.push(`/satellites/${props.satellite.id}`)

// Approximate altitude from semi-major axis (Earth radius ~6371 km)
const altitudeKm = computed(() => {
  const sma = props.satellite.orbit?.semiMajorAxis
  if (!sma) return null
  return Math.round(sma - 6371)
})

const launchYear = computed(() => {
  if (!props.satellite.launchDate) return null
  return new Date(props.satellite.launchDate).getFullYear()
})

const inclinationDeg = computed(() => {
  const inc = props.satellite.orbit?.inclination
  if (inc === undefined || inc === null) return null
  return inc.toFixed(1)
})

const isActive = computed(() => props.satellite.status === ESatelliteStatus.Active)
</script>

<template>
  <div class="sat-card" :class="{ 'sat-card--active': isActive }" @click="navigate">
    <!-- Card header -->
    <div class="card-header">
      <div class="card-title-row">
        <span class="sat-name">{{ satellite.name }}</span>
        <RiskBadge :level="satellite.riskLevel" />
      </div>
      <div class="norad-id">NORAD #{{ satellite.noradId }}</div>
    </div>

    <!-- Status -->
    <div class="status-row">
      <StatusBadge :status="satellite.status" />
      <span v-if="launchYear" class="launch-year">Since {{ launchYear }}</span>
    </div>

    <!-- Orbital quick stats -->
    <div class="orbit-row">
      <div class="orbit-stat" v-if="inclinationDeg !== null">
        <span class="orbit-label">Inc.</span>
        <span class="orbit-value">{{ inclinationDeg }}°</span>
      </div>
      <div class="orbit-stat" v-if="altitudeKm !== null">
        <span class="orbit-label">Alt.</span>
        <span class="orbit-value">~{{ altitudeKm.toLocaleString() }} km</span>
      </div>
      <div class="orbit-stat">
        <span class="orbit-label">Ecc.</span>
        <span class="orbit-value">{{ satellite.orbit?.eccentricity?.toFixed(4) ?? '—' }}</span>
      </div>
    </div>

    <!-- Footer counters -->
    <div class="card-footer">
      <div class="counter" :class="{ 'counter--warn': conjunctionCount > 0 }">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        </svg>
        {{ conjunctionCount }} {{ conjunctionCount === 1 ? 'conjunction' : 'conjunctions' }}
      </div>
      <div class="counter" :class="{ 'counter--danger': alertCount > 0 }">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {{ alertCount }} {{ alertCount === 1 ? 'alert' : 'alerts' }}
      </div>

      <div class="view-link">
        View details
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sat-card {
  background: #0f1e35;
  border: 1px solid #1e3350;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
  position: relative;
  overflow: hidden;
}

.sat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #253d5e;
  transition: background 0.2s;
}

.sat-card--active::before { background: #4ade80; }

.sat-card:hover {
  border-color: rgba(56, 189, 248, 0.35);
  background: #122240;
  transform: translateY(-1px);
}

/* Header */
.card-header { display: flex; flex-direction: column; gap: 0.3rem; }

.card-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.sat-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f1f5f9;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.norad-id {
  font-size: 0.72rem;
  color: #7a90a8;
  font-family: monospace;
  letter-spacing: 0.03em;
}

/* Status */
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.launch-year {
  font-size: 0.72rem;
  color: #7a90a8;
}

/* Orbit row */
.orbit-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.orbit-stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.orbit-label {
  font-size: 0.65rem;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.orbit-value {
  font-size: 0.8rem;
  color: #b0c4d8;
  font-family: monospace;
}

/* Footer */
.card-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
  border-top: 1px solid #1e3350;
}

.counter {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #7a90a8;
}

.counter--warn { color: #fbbf24; }
.counter--danger { color: #f87171; }

.view-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  color: #38bdf8;
  margin-left: auto;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.sat-card:hover .view-link { opacity: 1; }
</style>
