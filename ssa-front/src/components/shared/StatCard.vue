<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  sublabel?: string
  accent?: 'default' | 'green' | 'yellow' | 'red'
}>()
</script>

<template>
  <div class="stat-card" :class="`stat-card--${accent ?? 'default'}`">
    <div class="stat-value">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
    <div v-if="sublabel" class="stat-sublabel">{{ sublabel }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  background: #0f1e35;
  border: 1px solid #1e3350;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-left: 3px solid #253d5e;
  transition: border-color 0.2s;
}

.stat-card--default { border-left-color: #38bdf8; }
.stat-card--green   { border-left-color: #4ade80; }
.stat-card--yellow  { border-left-color: #fbbf24; }
.stat-card--red     { border-left-color: #f87171; }

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1;
}

.stat-label {
  font-size: 0.78rem;
  color: #8fa0b8;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.stat-sublabel {
  font-size: 0.75rem;
  color: #7a90a8;
  margin-top: 0.15rem;
}
</style>
