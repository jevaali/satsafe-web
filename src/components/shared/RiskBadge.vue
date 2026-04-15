<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ level: string | undefined }>()

const normalized = computed(() => (props.level ?? '').toLowerCase())

const label = computed(() => {
  if (!props.level) return 'No Data'
  return props.level.charAt(0).toUpperCase() + props.level.slice(1).toLowerCase()
})

const cls = computed(() => {
  const l = normalized.value
  if (l === 'critical') return 'risk--critical'
  if (l === 'high') return 'risk--high'
  if (l === 'medium' || l === 'moderate') return 'risk--medium'
  if (l === 'low' || l === 'minimal') return 'risk--low'
  return 'risk--none'
})
</script>

<template>
  <span class="risk-badge" :class="cls">{{ label }}</span>
</template>

<style scoped>
.risk-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.risk--critical { background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
.risk--high     { background: rgba(239, 68, 68, 0.12); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }
.risk--medium   { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
.risk--low      { background: rgba(34, 197, 94, 0.1);  color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
.risk--none     { background: rgba(100, 116, 139, 0.12); color: #64748b; border: 1px solid rgba(100,116,139,0.2); }
</style>
