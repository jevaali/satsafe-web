<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { useConjunctionStore } from '@/stores/conjunction-store'
import { EConjunctionEventStatus, EOperatorAcknowledgement } from '@/domain'
import RiskBadge from '@/components/shared/RiskBadge.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import SeverityBadge from '@/components/shared/SeverityBadge.vue'

const props = defineProps<{ conjunctionId: string | null }>()
const emit = defineEmits<{ close: [] }>()

const store = useConjunctionStore()

watch(
  () => props.conjunctionId,
  (id) => {
    if (id) store.fetchDetails(id)
    else store.clearSelection()
  },
)

const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))

const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatProb = (p: number) => {
  if (p === undefined || p === null) return '—'
  if (p < 0.0001) return p.toExponential(2)
  return (p * 100).toFixed(3) + '%'
}

const statusLabel = (s: EConjunctionEventStatus) => ({
  [EConjunctionEventStatus.AlreadyOccurred]: 'Occurred',
  [EConjunctionEventStatus.Imminent]: 'Imminent',
  [EConjunctionEventStatus.Potential]: 'Potential',
  [EConjunctionEventStatus.Resolved]: 'Resolved',
  [EConjunctionEventStatus.Pending]: 'Pending',
}[s] ?? '—')

const ackLabel = (a: EOperatorAcknowledgement) => ({
  [EOperatorAcknowledgement.None]: 'None',
  [EOperatorAcknowledgement.Noticed]: 'Noticed',
  [EOperatorAcknowledgement.Confirmed]: 'Confirmed',
  [EOperatorAcknowledgement.Resolved]: 'Resolved',
}[a] ?? '—')

const ackClass = (a: EOperatorAcknowledgement) =>
  a === EOperatorAcknowledgement.None ? 'ack--none' : 'ack--done'

const orbitRows = (orbit: any) => orbit ? [
  ['SMA', orbit.semiMajorAxis?.toFixed(2) + ' km'],
  ['Eccentricity', orbit.eccentricity?.toFixed(6)],
  ['Inclination', orbit.inclination?.toFixed(4) + '°'],
  ['RAAN', orbit.raan?.toFixed(4) + '°'],
  ['Arg. Perigee', orbit.argumentOfPerigee?.toFixed(4) + '°'],
  ['Mean Anomaly', orbit.meanAnomaly?.toFixed(4) + '°'],
] : []
</script>

<template>
  <Teleport to="body">
    <div v-if="conjunctionId" class="backdrop" @click.self="emit('close')">
      <div class="modal" role="dialog" aria-modal="true">

        <!-- Header -->
        <div class="modal-header">
          <div class="header-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
            <span>Conjunction Event</span>
          </div>
          <button class="close-btn" @click="emit('close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Skeleton -->
        <div v-if="store.detailLoading" class="loading-body">
          <div class="skeleton" v-for="i in 6" :key="i" :style="{ width: (i % 3 === 0 ? 55 : i % 2 === 0 ? 75 : 90) + '%' }" />
        </div>

        <!-- Body -->
        <div v-else-if="store.selectedConjunction" class="modal-body">

          <!-- Objects -->
          <div class="objects-row">
            <div class="object-block">
              <span class="object-role">Primary</span>
              <span class="object-name">{{ store.selectedConjunction.primaryObjectName }}</span>
              <span class="object-norad">NORAD {{ store.selectedConjunction.primaryNoradId }}</span>
              <StatusBadge :status="store.selectedConjunction.primaryObjectStatus" />
            </div>
            <div class="vs-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
            <div class="object-block object-block--right">
              <span class="object-role">Secondary</span>
              <span class="object-name">{{ store.selectedConjunction.secondaryObjectName }}</span>
              <span class="object-norad">NORAD {{ store.selectedConjunction.secondaryNoradId }}</span>
              <StatusBadge :status="store.selectedConjunction.secondaryObjectStatus" />
            </div>
          </div>

          <!-- Key stats -->
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Time of Closest Approach</span>
              <span class="stat-val">{{ formatDate(store.selectedConjunction.timeOfClosestApproach) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Miss Distance</span>
              <span class="stat-val">{{ store.selectedConjunction.missDistance?.toFixed(3) ?? '—' }} km</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Collision Probability</span>
              <span class="stat-val" :class="{ 'val--danger': store.selectedConjunction.isHighRisk }">
                {{ formatProb(store.selectedConjunction.collisionProbability) }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Status</span>
              <span class="stat-val">{{ statusLabel(store.selectedConjunction.status) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Risk Level</span>
              <RiskBadge :level="store.selectedConjunction.isHighRisk ? 'high' : 'low'" />
            </div>
          </div>

          <!-- Orbital parameters -->
          <div class="section-title">Orbital Parameters</div>
          <div class="orbits-grid">
            <div class="orbit-col">
              <div class="orbit-header">{{ store.selectedConjunction.primaryObjectName }}</div>
              <div class="orbit-params">
                <div class="param-row" v-for="[label, val] in orbitRows(store.selectedConjunction.primaryOrbit)" :key="label">
                  <span class="param-label">{{ label }}</span>
                  <span class="param-val">{{ val }}</span>
                </div>
              </div>
            </div>
            <div class="orbit-col">
              <div class="orbit-header">{{ store.selectedConjunction.secondaryObjectName }}</div>
              <div class="orbit-params">
                <div class="param-row" v-for="[label, val] in orbitRows(store.selectedConjunction.secondaryOrbit)" :key="label">
                  <span class="param-label">{{ label }}</span>
                  <span class="param-val">{{ val }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Acknowledgements -->
          <div class="section-title">Operator Acknowledgements</div>
          <div class="ack-row">
            <div class="ack-item">
              <span class="ack-side">Primary</span>
              <span class="ack-val" :class="ackClass(store.selectedConjunction.primaryAcknowledgement)">
                {{ ackLabel(store.selectedConjunction.primaryAcknowledgement) }}
              </span>
            </div>
            <div class="ack-divider" />
            <div class="ack-item">
              <span class="ack-side">Secondary</span>
              <span class="ack-val" :class="ackClass(store.selectedConjunction.secondaryAcknowledgement)">
                {{ ackLabel(store.selectedConjunction.secondaryAcknowledgement) }}
              </span>
            </div>
          </div>

          <!-- Linked alerts -->
          <template v-if="store.selectedConjunction.alerts?.length">
            <div class="section-title">
              Linked Alerts
              <span class="section-count">{{ store.selectedConjunction.alerts.length }}</span>
            </div>
            <div class="linked-alert-list">
              <div
                class="linked-alert-row"
                v-for="a in store.selectedConjunction.alerts"
                :key="a.id"
              >
                <SeverityBadge :severity="a.severity" />
                <span class="linked-alert-msg">{{ a.message }}</span>
                <span class="linked-alert-time">{{ formatDate(a.createdAt) }}</span>
                <span v-if="a.isAcknowledged" class="ack-ok">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Backdrop ─────────────────────────────────────── */
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(2, 6, 14, 0.82);
  backdrop-filter: blur(4px);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  animation: fade-in 0.15s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── Modal shell ──────────────────────────────────── */
.modal {
  background: #0f1e35;
  border: 1px solid #253d5e;
  border-top: 2px solid #38bdf8;
  border-radius: 14px;
  width: 100%;
  max-width: 800px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slide-up 0.18s ease;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7);
}

@keyframes slide-up {
  from { transform: translateY(14px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ── Header ───────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #1e3350;
  flex-shrink: 0;
  background: #0c1829;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 6px;
  display: flex;
  transition: color 0.15s, background 0.15s;
}
.close-btn:hover { color: #f1f5f9; background: rgba(255,255,255,0.08); }

/* ── Skeleton ─────────────────────────────────────── */
.loading-body {
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.skeleton {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #0c1829 25%, #1a3050 50%, #0c1829 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Body ─────────────────────────────────────────── */
.modal-body {
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.modal-body::-webkit-scrollbar { width: 4px; }
.modal-body::-webkit-scrollbar-track { background: transparent; }
.modal-body::-webkit-scrollbar-thumb { background: #253d5e; border-radius: 2px; }

/* ── Objects hero ─────────────────────────────────── */
.objects-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: #0c1829;
  border: 1px solid #1e3350;
  border-radius: 10px;
  padding: 1.1rem 1.25rem;
}

.object-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.object-block--right {
  align-items: flex-end;
  text-align: right;
}

.object-role {
  font-size: 0.63rem;
  font-weight: 700;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.object-name {
  font-size: 1rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.object-norad {
  font-size: 0.72rem;
  color: #7a90a8;
  font-family: monospace;
}

.vs-icon {
  color: #253d5e;
  flex-shrink: 0;
}

/* ── Stats grid ───────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  gap: 0.75rem;
}

.stat-item {
  background: #0c1829;
  border: 1px solid #1e3350;
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stat-label {
  font-size: 0.63rem;
  font-weight: 600;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.stat-val {
  font-size: 0.9rem;
  font-weight: 600;
  color: #dde6f0;
  font-family: monospace;
}

.val--danger { color: #f87171; }

/* ── Section title ────────────────────────────────── */
.section-title {
  font-size: 0.68rem;
  font-weight: 700;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 0.6rem;
  border-left: 2px solid #38bdf8;
}

.section-count {
  background: #1e3350;
  color: #94a3b8;
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 8px;
}

/* ── Orbital parameters ───────────────────────────── */
.orbits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 540px) {
  .orbits-grid { grid-template-columns: 1fr; }
}

.orbit-col {
  background: #0c1829;
  border: 1px solid #1e3350;
  border-radius: 8px;
  overflow: hidden;
}

.orbit-header {
  padding: 0.55rem 0.9rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #94a3b8;
  background: #0f2040;
  border-bottom: 1px solid #1e3350;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.orbit-params { padding: 0.4rem 0; }

.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0.9rem;
  gap: 0.5rem;
}

.param-row:hover { background: rgba(56,189,248,0.04); }

.param-label {
  font-size: 0.72rem;
  color: #7a90a8;
  white-space: nowrap;
}

.param-val {
  font-size: 0.75rem;
  color: #dde6f0;
  font-family: monospace;
  font-weight: 600;
}

/* ── Acknowledgements ─────────────────────────────── */
.ack-row {
  display: flex;
  align-items: center;
  background: #0c1829;
  border: 1px solid #1e3350;
  border-radius: 8px;
  padding: 0.9rem 1.25rem;
  gap: 1rem;
}

.ack-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ack-divider {
  width: 1px;
  height: 36px;
  background: #1e3350;
}

.ack-side {
  font-size: 0.63rem;
  font-weight: 700;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ack-val {
  font-size: 0.88rem;
  font-weight: 700;
}

.ack--none { color: #64748b; }
.ack--done { color: #4ade80; }

/* ── Linked alerts ────────────────────────────────── */
.linked-alert-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.linked-alert-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #0c1829;
  border: 1px solid #1e3350;
  border-radius: 8px;
  padding: 0.65rem 0.9rem;
}

.linked-alert-msg {
  flex: 1;
  font-size: 0.83rem;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.linked-alert-time {
  font-size: 0.68rem;
  color: #7a90a8;
  font-family: monospace;
  white-space: nowrap;
  flex-shrink: 0;
}

.ack-ok {
  color: #4ade80;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
</style>
