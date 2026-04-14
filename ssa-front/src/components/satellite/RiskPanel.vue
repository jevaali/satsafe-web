<script setup lang="ts">
import { computed } from 'vue'
import type { IRiskAssessment } from '@/domain'
import RiskBadge from '@/components/shared/RiskBadge.vue'

const props = defineProps<{
  riskAssessment: IRiskAssessment | undefined
  loading: boolean
  satelliteId: string
}>()

const emit = defineEmits<{ generateRisk: [id: string] }>()

const formattedDate = computed(() => {
  if (!props.riskAssessment?.calculatedAt) return '—'
  return new Date(props.riskAssessment.calculatedAt).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
})

const scorePercent = computed(() => {
  const score = props.riskAssessment?.riskScore
  if (score === undefined || score === null) return 0
  return Math.min(Math.round(score * 100), 100)
})

const barColor = computed(() => {
  const l = (props.riskAssessment?.riskLevel ?? '').toLowerCase()
  if (l === 'critical') return '#ef4444'
  if (l === 'high') return '#f87171'
  if (l === 'medium' || l === 'moderate') return '#fbbf24'
  if (l === 'low' || l === 'minimal') return '#4ade80'
  return '#38bdf8'
})
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <h2 class="panel-title">Risk Assessment</h2>

      <button
        class="generate-btn"
        :disabled="loading"
        @click="emit('generateRisk', satelliteId)"
        title="Generate risk assessment"
      >
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          :class="{ 'spinning': loading }"
        >
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        {{ loading ? 'Generating…' : 'Generate' }}
      </button>
    </div>

    <div class="panel-body">
      <template v-if="riskAssessment">
        <div class="risk-score-row">
          <div class="score-block">
            <span class="score-label">Risk Score</span>
            <span class="score-value">{{ riskAssessment.riskScore?.toFixed(3) ?? '—' }}</span>
          </div>
          <RiskBadge :level="riskAssessment.riskLevel" />
        </div>

        <!-- Score bar -->
        <div class="score-bar-wrap">
          <div
            class="score-bar-fill"
            :style="{ width: scorePercent + '%', background: barColor }"
          />
        </div>

        <div class="risk-meta">
          <div class="meta-row">
            <span class="meta-label">Model Version</span>
            <span class="meta-value">{{ riskAssessment.modelVersion ?? '—' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Calculated At</span>
            <span class="meta-value">{{ formattedDate }}</span>
          </div>
        </div>
      </template>

      <div v-else class="no-risk">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <p>No risk assessment yet</p>
        <p class="hint">Click Generate to run the risk model</p>
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
  flex: 1;
  font-size: 0.78rem;
  font-weight: 700;
  color: #b0c4d8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.generate-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 6px;
  color: #38bdf8;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.generate-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.4);
}

.generate-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.panel-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.risk-score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.score-block { display: flex; flex-direction: column; gap: 0.2rem; }

.score-label {
  font-size: 0.68rem;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 600;
}

.score-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #f1f5f9;
  font-family: monospace;
}

/* Score bar */
.score-bar-wrap {
  height: 5px;
  background: #1e3350;
  border-radius: 3px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

/* Meta */
.risk-meta { display: flex; flex-direction: column; gap: 0.5rem; }

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.meta-label {
  font-size: 0.72rem;
  color: #7a90a8;
  font-weight: 500;
}

.meta-value {
  font-size: 0.78rem;
  color: #b0c4d8;
  font-family: monospace;
}

/* Empty */
.no-risk {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 0;
  color: #3d5a78;
}

.no-risk p { margin: 0; font-size: 0.85rem; color: #7a90a8; }
.hint { font-size: 0.72rem !important; color: #3d5a78 !important; }
</style>
