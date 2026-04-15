<script setup lang="ts">
import { computed } from 'vue'
import { ESatelliteStatus } from '@/domain'

const props = defineProps<{ status: ESatelliteStatus }>()

const label = computed(() => {
  const map: Record<ESatelliteStatus, string> = {
    [ESatelliteStatus.Active]: 'Active',
    [ESatelliteStatus.Inactive]: 'Inactive',
    [ESatelliteStatus.Decommissioned]: 'Decommissioned',
    [ESatelliteStatus.Lost]: 'Lost',
    [ESatelliteStatus.Unknown]: 'Unknown',
    [ESatelliteStatus.Deleted]: 'Deleted',
  }
  return map[props.status] ?? 'Unknown'
})

const cls = computed(() => {
  const map: Record<ESatelliteStatus, string> = {
    [ESatelliteStatus.Active]: 'status--active',
    [ESatelliteStatus.Inactive]: 'status--inactive',
    [ESatelliteStatus.Decommissioned]: 'status--decommissioned',
    [ESatelliteStatus.Lost]: 'status--lost',
    [ESatelliteStatus.Unknown]: 'status--unknown',
    [ESatelliteStatus.Deleted]: 'status--deleted',
  }
  return map[props.status] ?? 'status--unknown'
})
</script>

<template>
  <span class="status-badge" :class="cls">
    <span class="dot" />
    {{ label }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status--active   { background: rgba(34, 197, 94, 0.12); color: #4ade80; }
.status--active .dot { background: #4ade80; box-shadow: 0 0 6px #4ade80; }

.status--inactive { background: rgba(251, 191, 36, 0.12); color: #fbbf24; }
.status--inactive .dot { background: #fbbf24; }

.status--decommissioned { background: rgba(100, 116, 139, 0.15); color: #94a3b8; }
.status--decommissioned .dot { background: #94a3b8; }

.status--lost     { background: rgba(239, 68, 68, 0.1); color: #f87171; }
.status--lost .dot { background: #f87171; }

.status--unknown  { background: rgba(148, 163, 184, 0.1); color: #64748b; }
.status--unknown .dot { background: #64748b; }

.status--deleted  { background: rgba(100, 116, 139, 0.08); color: #475569; }
.status--deleted .dot { background: #475569; }
</style>
