<script setup lang="ts">
import { ref } from 'vue'
import type { IAlertListItem } from '@/domain'
import SeverityBadge from '@/components/shared/SeverityBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import AlertDetailModal from './AlertDetailModal.vue'

const props = defineProps<{
  alerts: IAlertListItem[]
  loading: boolean
  actionLoading: boolean
}>()

const emit = defineEmits<{
  acknowledge: [id: string]
}>()

const selectedAlertId = ref<string | null>(null)

const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <h2 class="panel-title">Alerts</h2>
      <span class="count-chip" :class="{ 'count-chip--danger': alerts.filter(a => !a.isAcknowledged).length > 0 }">
        {{ alerts.filter(a => !a.isAcknowledged).length }} unack.
      </span>
      <span class="count-chip" style="margin-left: 0.25rem;">{{ alerts.length }} total</span>
    </div>

    <div v-if="loading" class="skeleton-list">
      <div class="skeleton-row" v-for="i in 3" :key="i" />
    </div>

    <EmptyState v-else-if="alerts.length === 0" message="No alerts for this satellite" />

    <div v-else class="alert-list">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="alert-row"
        :class="{ 'alert-row--acknowledged': alert.isAcknowledged }"
        role="button"
        tabindex="0"
        @click="selectedAlertId = alert.id"
        @keydown.enter="selectedAlertId = alert.id"
      >
        <div class="alert-main">
          <SeverityBadge :severity="alert.severity" />
          <p class="alert-message">{{ alert.message }}</p>
        </div>

        <div class="alert-footer">
          <span class="alert-time">{{ formatDate(alert.createdAt) }}</span>

          <div class="alert-actions">
            <span v-if="alert.isAcknowledged" class="ack-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Acknowledged
            </span>
            <button
              v-else
              class="ack-btn"
              :disabled="actionLoading"
              @click.stop="emit('acknowledge', alert.id)"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <AlertDetailModal
    :alert-id="selectedAlertId"
    @close="selectedAlertId = null"
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
  padding: 0.18rem 0.45rem;
  border-radius: 10px;
  font-size: 0.68rem;
  font-weight: 700;
  background: #1e3350;
  color: #7a90a8;
}

.count-chip--danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

/* Skeleton */
.skeleton-list { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton-row {
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(90deg, #0c1829 25%, #1e3350 50%, #0c1829 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.alert-list { display: flex; flex-direction: column; }

.alert-row {
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #1e3350;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: background 0.15s;
}

.alert-row:last-child { border-bottom: none; }
.alert-row { cursor: pointer; }
.alert-row:hover { background: rgba(56, 189, 248, 0.05); }
.alert-row--acknowledged { opacity: 0.5; }

.alert-main {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.alert-message {
  flex: 1;
  font-size: 0.85rem;
  color: #dde6f0;
  margin: 0;
  line-height: 1.45;
}

.alert-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.alert-time {
  font-size: 0.7rem;
  color: #7a90a8;
  font-family: monospace;
}

.alert-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ack-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  color: #4ade80;
  opacity: 0.8;
}

.ack-btn {
  padding: 0.2rem 0.55rem;
  border-radius: 5px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  background: rgba(56, 189, 248, 0.08);
  color: #38bdf8;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.ack-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.16);
  border-color: rgba(56, 189, 248, 0.45);
}

.ack-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
