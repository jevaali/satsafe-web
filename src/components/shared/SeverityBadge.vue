<script setup lang="ts">
import { computed } from 'vue'
import { EAlertSeverity } from '@/domain'

const props = defineProps<{ severity: EAlertSeverity }>()

const label = computed(() => {
  const map: Record<EAlertSeverity, string> = {
    [EAlertSeverity.Low]: 'Low',
    [EAlertSeverity.Medium]: 'Medium',
    [EAlertSeverity.High]: 'High',
    [EAlertSeverity.Critical]: 'Critical',
  }
  return map[props.severity] ?? 'Unknown'
})

const cls = computed(() => {
  const map: Record<EAlertSeverity, string> = {
    [EAlertSeverity.Low]: 'sev--low',
    [EAlertSeverity.Medium]: 'sev--medium',
    [EAlertSeverity.High]: 'sev--high',
    [EAlertSeverity.Critical]: 'sev--critical',
  }
  return map[props.severity] ?? 'sev--low'
})
</script>

<template>
  <span class="severity-badge" :class="cls">{{ label }}</span>
</template>

<style scoped>
.severity-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sev--low      { background: rgba(34, 197, 94, 0.1);  color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
.sev--medium   { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
.sev--high     { background: rgba(239, 68, 68, 0.12);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }
.sev--critical { background: rgba(239, 68, 68, 0.2);   color: #f87171; border: 1px solid rgba(239,68,68,0.35); }
</style>
