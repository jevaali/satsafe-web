<script setup lang="ts">
import type { IOrbit } from '@/domain'

defineProps<{ orbit: IOrbit }>()

const fmt = (n: number | undefined, decimals = 4): string => {
  if (n === undefined || n === null) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals })
}
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
      <h2 class="panel-title">Orbital Parameters</h2>
    </div>

    <div class="orbit-grid">
      <div class="orbit-param">
        <span class="param-label">Semi-Major Axis</span>
        <span class="param-value">{{ fmt(orbit.semiMajorAxis, 2) }} <span class="param-unit">km</span></span>
      </div>
      <div class="orbit-param">
        <span class="param-label">Eccentricity</span>
        <span class="param-value">{{ fmt(orbit.eccentricity) }}</span>
      </div>
      <div class="orbit-param">
        <span class="param-label">Inclination</span>
        <span class="param-value">{{ fmt(orbit.inclination, 4) }} <span class="param-unit">°</span></span>
      </div>
      <div class="orbit-param">
        <span class="param-label">RAAN</span>
        <span class="param-value">{{ fmt(orbit.raan, 4) }} <span class="param-unit">°</span></span>
      </div>
      <div class="orbit-param">
        <span class="param-label">Arg. of Perigee</span>
        <span class="param-value">{{ fmt(orbit.argumentOfPerigee, 4) }} <span class="param-unit">°</span></span>
      </div>
      <div class="orbit-param">
        <span class="param-label">Mean Anomaly</span>
        <span class="param-value">{{ fmt(orbit.meanAnomaly, 4) }} <span class="param-unit">°</span></span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  background: #0f1e35;
  border: 1px solid #1e3350;
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #1e3350;
  color: #7a90a8;
  background: #0c1829;
}

.panel-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #b0c4d8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.orbit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.orbit-param {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #1e3350;
  border-right: 1px solid #1e3350;
}

.orbit-param:nth-child(2n) { border-right: none; }
.orbit-param:nth-last-child(-n+2) { border-bottom: none; }

.param-label {
  font-size: 0.68rem;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 600;
}

.param-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.param-unit {
  font-size: 0.72rem;
  color: #8fa0b8;
  font-weight: 400;
}
</style>
