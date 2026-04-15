<script setup lang="ts">
import { computed } from 'vue'
import type { ISatelliteDetail } from '@/domain'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import RiskBadge from '@/components/shared/RiskBadge.vue'

const props = defineProps<{
  satellite: ISatelliteDetail
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const launchDate = computed(() => {
  if (!props.satellite.launchDate) return '—'
  return new Date(props.satellite.launchDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
})

const riskLevel = computed(() => props.satellite.riskAssessment?.riskLevel)
</script>

<template>
  <div class="satellite-hero">
    <div class="hero-main">
      <div class="hero-title-block">
        <h1 class="sat-title">{{ satellite.name }}</h1>
        <div class="sat-meta">
          <span class="norad-id">NORAD #{{ satellite.noradId }}</span>
          <span class="meta-divider">·</span>
          <span class="launch-info">Launched {{ launchDate }}</span>
        </div>
      </div>

      <div class="hero-badges">
        <StatusBadge :status="satellite.status" />
        <RiskBadge :level="riskLevel" />
      </div>
    </div>

    <!-- Subtle CRUD actions -->
    <div class="hero-actions">
      <button class="action-btn action-btn--edit" @click="emit('edit')" title="Edit satellite">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit
      </button>
      <button class="action-btn action-btn--delete" @click="emit('delete')" title="Delete satellite">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
        Delete
      </button>
    </div>
  </div>
</template>

<style scoped>
.satellite-hero {
  background: #0c1829;
  border: 1px solid #1e3350;
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.hero-main {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.hero-title-block { display: flex; flex-direction: column; gap: 0.3rem; }

.sat-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0;
  letter-spacing: -0.01em;
}

.sat-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.norad-id { font-family: monospace; color: #8fa0b8; }
.meta-divider { color: #3d5a78; }
.launch-info { color: #8fa0b8; }

.hero-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Subtle action buttons */
.hero-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  background: transparent;
}

.action-btn--edit {
  color: #7a90a8;
  border-color: #1e3350;
}

.action-btn--edit:hover {
  color: #b0c4d8;
  background: rgba(255,255,255,0.05);
  border-color: #253d5e;
}

.action-btn--delete {
  color: #7a90a8;
  border-color: #1e3350;
}

.action-btn--delete:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.07);
  border-color: rgba(239, 68, 68, 0.25);
}
</style>
