<script setup lang="ts">
import StatCard from '@/components/shared/StatCard.vue'

defineProps<{
  totalSatellites: number
  activeSatellites: number
  highRiskConjunctions: number
  unacknowledgedAlerts: number
}>()
</script>

<template>
  <div class="fleet-stats">
    <StatCard label="Total Satellites" :value="totalSatellites" accent="default" />
    <StatCard label="Active" :value="activeSatellites" accent="green" />
    <StatCard
      label="High-Risk Conjunctions"
      :value="highRiskConjunctions"
      :accent="highRiskConjunctions > 0 ? 'red' : 'default'"
    />
    <StatCard
      label="Unacknowledged Alerts"
      :value="unacknowledgedAlerts"
      :accent="unacknowledgedAlerts > 0 ? 'yellow' : 'default'"
    />
  </div>
</template>

<style scoped>
.fleet-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 900px) {
  .fleet-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
