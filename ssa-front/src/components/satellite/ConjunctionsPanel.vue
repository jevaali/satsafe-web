<script setup lang="ts">
import { ref } from 'vue'
import type { IConjunctionListItem } from '@/domain'
import { EConjunctionEventStatus } from '@/domain'
import RiskBadge from '@/components/shared/RiskBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import ConjunctionDetailModal from './ConjunctionDetailModal.vue'

const props = defineProps<{
  conjunctions: IConjunctionListItem[]
  satelliteId: string
  loading: boolean
}>()

const selectedConjunctionId = ref<string | null>(null)

const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatProb = (p: number) => {
  if (p === undefined || p === null) return '—'
  if (p < 0.0001) return p.toExponential(2)
  return (p * 100).toFixed(3) + '%'
}

const statusLabel = (s: EConjunctionEventStatus) => {
  if (s === EConjunctionEventStatus.AlreadyOccurred) return 'Occurred'
  if (s === EConjunctionEventStatus.Imminent) return 'Imminent'
  if (s === EConjunctionEventStatus.Potential) return 'Potential'
  if (s === EConjunctionEventStatus.Resolved) return 'Resolved'
  if (s === EConjunctionEventStatus.Pending) return 'Pending'
  return '—'
}

const statusClass = (s: EConjunctionEventStatus) => {
  if (s === EConjunctionEventStatus.Imminent) return 'chip--imminent'
  if (s === EConjunctionEventStatus.Potential) return 'chip--potential'
  if (s === EConjunctionEventStatus.Resolved) return 'chip--resolved'
  return 'chip--muted'
}

// Determine the "other" object name relative to our satellite
const otherName = (c: IConjunctionListItem) => {
  return c.primaryObjectId === props.satelliteId
    ? c.secondaryObjectName
    : c.primaryObjectName
}
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      </svg>
      <h2 class="panel-title">Conjunction Events</h2>
      <span class="count-chip" :class="{ 'count-chip--warn': conjunctions.length > 0 }">
        {{ conjunctions.length }}
      </span>
    </div>

    <div v-if="loading" class="skeleton-list">
      <div class="skeleton-row" v-for="i in 3" :key="i" />
    </div>

    <EmptyState v-else-if="conjunctions.length === 0" message="No conjunction events for this satellite" />

    <div v-else class="conjunction-list">
      <div
        v-for="c in conjunctions"
        :key="c.id"
        class="conjunction-row"
        :class="{ 'conjunction-row--high-risk': c.isHighRisk }"
        role="button"
        tabindex="0"
        @click="selectedConjunctionId = c.id"
        @keydown.enter="selectedConjunctionId = c.id"
      >
        <div class="row-main">
          <div class="row-objects">
            <span class="primary-name">{{ c.primaryObjectName }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="vs-icon">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
            <span class="secondary-name">{{ c.secondaryObjectName }}</span>
          </div>
          <div class="row-badges">
            <RiskBadge :level="c.isHighRisk ? 'high' : 'low'" />
            <span class="status-chip" :class="statusClass(c.status)">{{ statusLabel(c.status) }}</span>
          </div>
        </div>

        <div class="row-stats">
          <div class="stat-item">
            <span class="stat-label">TCA</span>
            <span class="stat-val">{{ formatDate(c.timeOfClosestApproach) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Miss Dist.</span>
            <span class="stat-val">{{ c.missDistance?.toFixed(3) ?? '—' }} km</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Collision Prob.</span>
            <span class="stat-val" :class="{ 'val--danger': c.isHighRisk }">{{ formatProb(c.collisionProbability) }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <ConjunctionDetailModal
    :conjunction-id="selectedConjunctionId"
    @close="selectedConjunctionId = null"
  />
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
  flex: 1;
  font-size: 0.78rem;
  font-weight: 700;
  color: #b0c4d8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.count-chip {
  min-width: 20px;
  height: 20px;
  padding: 0 0.4rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e3350;
  color: #7a90a8;
}

.count-chip--warn {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

/* Skeleton */
.skeleton-list { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton-row {
  height: 72px;
  border-radius: 8px;
  background: linear-gradient(90deg, #0c1829 25%, #1e3350 50%, #0c1829 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* List */
.conjunction-list {
  display: flex;
  flex-direction: column;
}

.conjunction-row {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #1e3350;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: background 0.15s;
}

.conjunction-row:last-child { border-bottom: none; }
.conjunction-row { cursor: pointer; }
.conjunction-row:hover { background: rgba(56, 189, 248, 0.05); }
.conjunction-row--high-risk { border-left: 3px solid rgba(239, 68, 68, 0.6); }

.row-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.row-objects {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.primary-name, .secondary-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.vs-icon { color: #3d5a78; flex-shrink: 0; }

.row-badges {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.status-chip {
  display: inline-block;
  padding: 0.18rem 0.5rem;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.chip--imminent  { background: rgba(239,68,68,0.14); color: #f87171; }
.chip--potential { background: rgba(251,191,36,0.14); color: #fbbf24; }
.chip--resolved  { background: rgba(34,197,94,0.12); color: #4ade80; }
.chip--muted     { background: rgba(122,144,168,0.15); color: #8fa0b8; }

.row-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat-item { display: flex; flex-direction: column; gap: 0.15rem; }

.stat-label {
  font-size: 0.65rem;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat-val {
  font-size: 0.8rem;
  color: #b0c4d8;
  font-family: monospace;
}

.val--danger { color: #f87171; }
</style>
