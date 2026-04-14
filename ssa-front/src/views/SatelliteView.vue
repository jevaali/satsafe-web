<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSatelliteStore } from '@/stores/satellite-store'
import { useConjunctionStore } from '@/stores/conjunction-store'
import { useAlertStore } from '@/stores/alert-store'
import type { ISatelliteListItem } from '@/domain'
import SatelliteHero from '@/components/satellite/SatelliteHero.vue'
import OrbitVisualisation from '@/components/satellite/OrbitVisualisation.vue'
import OrbitPanel from '@/components/satellite/OrbitPanel.vue'
import RiskPanel from '@/components/satellite/RiskPanel.vue'
import ConjunctionsPanel from '@/components/satellite/ConjunctionsPanel.vue'
import AlertsPanel from '@/components/satellite/AlertsPanel.vue'
import SatelliteFormModal from '@/components/satellite/SatelliteFormModal.vue'

const route = useRoute()
const router = useRouter()
const satelliteStore = useSatelliteStore()
const conjunctionStore = useConjunctionStore()
const alertStore = useAlertStore()

const satelliteId = computed(() => route.params.id as string)

// Modal state
const modalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('edit')
const editTarget = ref<ISatelliteListItem | null>(null)

// Delete confirm state
const deleteConfirmOpen = ref(false)
const deleteLoading = ref(false)

// Load all required data
const loadData = async () => {
  await Promise.all([
    satelliteStore.fetchDetails(satelliteId.value),
    conjunctionStore.fetchList(),
    alertStore.fetchList(),
    // Make sure satellite list is loaded for the sidebar
    satelliteStore.satellites.length === 0 ? satelliteStore.fetchList() : Promise.resolve(),
  ])
}

onMounted(loadData)

// Reload when route changes (navigating between satellites via sidebar)
watch(satelliteId, loadData)

// Filter conjunctions involving this satellite
const satelliteConjunctions = computed(() =>
  conjunctionStore.conjunctions.filter(
    (c) => c.primaryObjectId === satelliteId.value || c.secondaryObjectId === satelliteId.value,
  ),
)

// Filter alerts linked to this satellite's conjunctions
const satelliteAlerts = computed(() => {
  const conjIds = new Set(satelliteConjunctions.value.map((c) => c.id))
  return alertStore.alerts.filter(
    (a) => a.hasConjunctionEvent && conjIds.has(a.conjunctionEventId),
  )
})

// CRUD actions
const openEdit = () => {
  const sat = satelliteStore.selectedSatellite
  if (!sat) return
  // Build the ISatelliteListItem shape for the form
  editTarget.value = {
    id: sat.id,
    name: sat.name,
    noradId: sat.noradId,
    launchDate: sat.launchDate,
    status: sat.status,
    riskLevel: sat.riskAssessment?.riskLevel ?? '',
    orbit: sat.orbit,
  }
  modalMode.value = 'edit'
  modalOpen.value = true
}

const confirmDelete = () => {
  deleteConfirmOpen.value = true
}

const cancelDelete = () => {
  deleteConfirmOpen.value = false
}

const executeDelete = async () => {
  deleteLoading.value = true
  try {
    await satelliteStore.remove(satelliteId.value)
    router.push('/')
  } finally {
    deleteLoading.value = false
    deleteConfirmOpen.value = false
  }
}

const onGenerateRisk = async (id: string) => {
  await satelliteStore.generateRisk(id)
}

const onAcknowledgeAlert = async (alertId: string) => {
  await alertStore.acknowledge(alertId)
}
</script>

<template>
  <div class="satellite-page">
    <!-- Loading state -->
    <div v-if="satelliteStore.detailLoading" class="page-loading">
      <div class="skeleton-hero" />
      <div class="skeleton-grid">
        <div class="skeleton-panel" v-for="i in 4" :key="i" />
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="satelliteStore.error && !satelliteStore.selectedSatellite" class="error-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Satellite not found</h3>
      <p>{{ satelliteStore.error }}</p>
      <button class="back-btn" @click="router.push('/')">← Back to Fleet Overview</button>
    </div>

    <!-- Main content -->
    <template v-else-if="satelliteStore.selectedSatellite">
      <!-- Hero -->
      <SatelliteHero
        :satellite="satelliteStore.selectedSatellite"
        @edit="openEdit"
        @delete="confirmDelete"
      />

      <!-- Orbit visualisation (single satellite) -->
      <OrbitVisualisation :satellite="satelliteStore.selectedSatellite" height="400px" />

      <!-- Two-column panel grid -->
      <div class="panel-grid">
        <!-- Left column -->
        <div class="col-left">
          <OrbitPanel :orbit="satelliteStore.selectedSatellite.orbit" />
          <RiskPanel
            :risk-assessment="satelliteStore.selectedSatellite.riskAssessment"
            :loading="satelliteStore.riskLoading"
            :satellite-id="satelliteId"
            @generate-risk="onGenerateRisk"
          />
        </div>

        <!-- Right column -->
        <div class="col-right">
          <ConjunctionsPanel
            :conjunctions="satelliteConjunctions"
            :satellite-id="satelliteId"
            :loading="conjunctionStore.loading"
          />
          <AlertsPanel
            :alerts="satelliteAlerts"
            :loading="alertStore.loading"
            :action-loading="alertStore.actionLoading"
            @acknowledge="onAcknowledgeAlert"
          />
        </div>
      </div>
    </template>

    <!-- Satellite form modal (edit) -->
    <SatelliteFormModal
      :open="modalOpen"
      :mode="modalMode"
      :edit-target="editTarget"
      @close="modalOpen = false"
    />

    <!-- Delete confirmation dialog -->
    <Teleport to="body">
      <div v-if="deleteConfirmOpen" class="modal-overlay" @click.self="cancelDelete">
        <div class="confirm-dialog">
          <h3 class="confirm-title">Delete Satellite?</h3>
          <p class="confirm-body">
            This will permanently remove
            <strong>{{ satelliteStore.selectedSatellite?.name }}</strong>
            and all associated data. This action cannot be undone.
          </p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="cancelDelete">Cancel</button>
            <button class="btn-danger" :disabled="deleteLoading" @click="executeDelete">
              {{ deleteLoading ? 'Deleting…' : 'Delete Satellite' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.satellite-page {
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 100%;
}

/* Two-column grid for panels */
.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 1.25rem;
  align-items: start;
}

.col-left, .col-right {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

@media (max-width: 960px) {
  .panel-grid { grid-template-columns: 1fr; }
}

/* Loading skeletons */
.page-loading {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.skeleton-hero {
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(90deg, #0d1a2d 25%, #1a2d4a 50%, #0d1a2d 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 1.25rem;
}

.skeleton-panel {
  height: 240px;
  border-radius: 12px;
  background: linear-gradient(90deg, #0d1a2d 25%, #1a2d4a 50%, #0d1a2d 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: #334155;
  text-align: center;
}

.error-state h3 { font-size: 1.1rem; font-weight: 600; color: #475569; margin: 0; }
.error-state p  { font-size: 0.85rem; color: #334155; margin: 0; }

.back-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 7px;
  border: 1px solid #1a2d4a;
  background: transparent;
  color: #64748b;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}

.back-btn:hover { color: #94a3b8; border-color: #2a4a6c; }

/* Delete confirm */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.confirm-dialog {
  background: #0d1a2d;
  border: 1px solid #1a2d4a;
  border-radius: 14px;
  padding: 1.75rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 16px 48px rgba(0,0,0,0.5);
}

.confirm-title {
  font-size: 1rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 0.75rem;
}

.confirm-body {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 1.25rem;
}

.confirm-body strong { color: #e2e8f0; }

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  padding: 0.5rem 1rem;
  border-radius: 7px;
  border: 1px solid #1a2d4a;
  background: transparent;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover { color: #94a3b8; background: rgba(255,255,255,0.04); }

.btn-danger {
  padding: 0.5rem 1.1rem;
  border-radius: 7px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.45);
}

.btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
