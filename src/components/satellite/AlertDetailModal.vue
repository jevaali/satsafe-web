<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAlertStore } from '@/stores/alert-store'
import { EConjunctionEventStatus } from '@/domain'
import SeverityBadge from '@/components/shared/SeverityBadge.vue'
import RiskBadge from '@/components/shared/RiskBadge.vue'

const props = defineProps<{ alertId: string | null }>()
const emit = defineEmits<{ close: [] }>()

const store = useAlertStore()

// ── Edit message state ─────────────────────────────────────────────────────
const editing = ref(false)
const editDraft = ref('')
const editError = ref<string | null>(null)

function startEdit() {
  editDraft.value = store.selectedAlert?.message ?? ''
  editError.value = null
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  editError.value = null
}

async function saveEdit() {
  if (!store.selectedAlert) return
  editError.value = null
  try {
    await store.updateMessage(store.selectedAlert.id, editDraft.value.trim())
    editing.value = false
  } catch {
    editError.value = 'Failed to save — please try again.'
  }
}

// ── Alert loading + keyboard ───────────────────────────────────────────────
watch(
  () => props.alertId,
  (id) => {
    editing.value = false
    editError.value = null
    if (id) store.fetchDetails(id)
    else store.clearSelection()
  },
)

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') editing.value ? cancelEdit() : emit('close')
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))

// ── Helpers ────────────────────────────────────────────────────────────────
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

const conjStatusLabel = (s: EConjunctionEventStatus) => ({
  [EConjunctionEventStatus.AlreadyOccurred]: 'Occurred',
  [EConjunctionEventStatus.Imminent]: 'Imminent',
  [EConjunctionEventStatus.Potential]: 'Potential',
  [EConjunctionEventStatus.Resolved]: 'Resolved',
  [EConjunctionEventStatus.Pending]: 'Pending',
}[s] ?? '—')

const handleAcknowledge = async () => {
  if (!store.selectedAlert) return
  await store.acknowledge(store.selectedAlert.id)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="alertId" class="backdrop" @click.self="emit('close')">
      <div class="modal" role="dialog" aria-modal="true">

        <!-- Header -->
        <div class="modal-header">
          <div class="header-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span>Alert Details</span>
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
          <div class="skeleton" v-for="i in 5" :key="i" :style="{ width: (i % 2 === 0 ? 55 : 85) + '%' }" />
        </div>

        <!-- Body -->
        <div v-else-if="store.selectedAlert" class="modal-body">

          <!-- Severity + message hero -->
          <div class="alert-hero">
            <div class="hero-top">
              <SeverityBadge :severity="store.selectedAlert.severity" />
              <button v-if="!editing" class="edit-btn" @click="startEdit" title="Edit message">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
            </div>

            <!-- View mode -->
            <p v-if="!editing" class="alert-message">{{ store.selectedAlert.message }}</p>

            <!-- Edit mode -->
            <template v-else>
              <textarea
                class="message-textarea"
                v-model="editDraft"
                rows="4"
                placeholder="Alert message…"
                autofocus
              />
              <p v-if="editError" class="edit-error">{{ editError }}</p>
              <div class="edit-actions">
                <button class="btn-cancel" @click="cancelEdit">Cancel</button>
                <button class="btn-save" :disabled="store.actionLoading || !editDraft.trim()" @click="saveEdit">
                  <svg v-if="store.actionLoading" class="spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  {{ store.actionLoading ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </template>
          </div>

          <!-- Meta row -->
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Created</span>
              <span class="meta-val">{{ formatDate(store.selectedAlert.createdAt) }}</span>
            </div>
            <div class="meta-item" v-if="store.selectedAlert.updatedAt">
              <span class="meta-label">Updated</span>
              <span class="meta-val">{{ formatDate(store.selectedAlert.updatedAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Acknowledgement</span>
              <span class="meta-val" :class="store.selectedAlert.isAcknowledged ? 'val--ok' : 'val--warn'">
                {{ store.selectedAlert.isAcknowledged ? 'Acknowledged' : 'Pending' }}
              </span>
            </div>
          </div>

          <!-- Acknowledge action -->
          <div v-if="!store.selectedAlert.isAcknowledged" class="ack-action">
            <button
              class="ack-btn"
              :disabled="store.actionLoading"
              @click="handleAcknowledge"
            >
              <svg v-if="store.actionLoading" class="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              {{ store.actionLoading ? 'Acknowledging…' : 'Acknowledge Alert' }}
            </button>
          </div>

          <!-- Linked conjunction event -->
          <template v-if="store.selectedAlert.conjunctionEvent">
            <div class="section-title">Linked Conjunction Event</div>
            <div class="conjunction-card">
              <div class="conj-stats">
                <div class="conj-stat">
                  <span class="stat-label">Time of Closest Approach</span>
                  <span class="stat-val">{{ formatDate(store.selectedAlert.conjunctionEvent.timeOfClosestApproach) }}</span>
                </div>
                <div class="conj-stat">
                  <span class="stat-label">Miss Distance</span>
                  <span class="stat-val">{{ store.selectedAlert.conjunctionEvent.missDistance?.toFixed(3) ?? '—' }} km</span>
                </div>
                <div class="conj-stat">
                  <span class="stat-label">Collision Probability</span>
                  <span class="stat-val" :class="{ 'val--danger': store.selectedAlert.conjunctionEvent.isHighRisk }">
                    {{ formatProb(store.selectedAlert.conjunctionEvent.collisionProbability) }}
                  </span>
                </div>
                <div class="conj-stat">
                  <span class="stat-label">Status</span>
                  <span class="stat-val">{{ conjStatusLabel(store.selectedAlert.conjunctionEvent.status) }}</span>
                </div>
                <div class="conj-stat">
                  <span class="stat-label">Risk Level</span>
                  <RiskBadge :level="store.selectedAlert.conjunctionEvent.isHighRisk ? 'high' : 'low'" />
                </div>
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
  max-width: 580px;
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

/* ── Alert hero ───────────────────────────────────── */
.alert-hero {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: #0c1829;
  border: 1px solid #1e3350;
  border-radius: 10px;
  padding: 1.1rem 1.25rem;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.6rem;
  border-radius: 5px;
  border: 1px solid rgba(100, 160, 255, 0.25);
  background: rgba(100, 160, 255, 0.07);
  color: #7aacdc;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.edit-btn:hover {
  background: rgba(100, 160, 255, 0.14);
  border-color: rgba(100, 160, 255, 0.45);
  color: #a8ccf0;
}

.alert-message {
  font-size: 1rem;
  color: #e2e8f0;
  line-height: 1.6;
  margin: 0;
}

.message-textarea {
  width: 100%;
  background: #0a1525;
  border: 1px solid rgba(100, 160, 255, 0.3);
  border-radius: 7px;
  color: #e2e8f0;
  font-size: 0.92rem;
  line-height: 1.6;
  padding: 0.65rem 0.85rem;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;
}
.message-textarea:focus {
  border-color: rgba(56, 189, 248, 0.55);
}

.edit-error {
  font-size: 0.75rem;
  color: #f87171;
  margin: 0;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-cancel {
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  border: 1px solid #1e3350;
  background: transparent;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover { color: #94a3b8; background: rgba(255,255,255,0.04); }

.btn-save {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.9rem;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-save:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.55);
}
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Meta grid ────────────────────────────────────── */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  gap: 0.75rem;
}

.meta-item {
  background: #0c1829;
  border: 1px solid #1e3350;
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.meta-label {
  font-size: 0.63rem;
  font-weight: 600;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.meta-val {
  font-size: 0.88rem;
  font-weight: 600;
  color: #dde6f0;
  font-family: monospace;
}

.val--ok   { color: #4ade80; }
.val--warn { color: #fbbf24; }

/* ── Acknowledge ──────────────────────────────────── */
.ack-action { display: flex; }

.ack-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.ack-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.55);
}

.ack-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.spin { animation: spin 0.8s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Section title ────────────────────────────────── */
.section-title {
  font-size: 0.68rem;
  font-weight: 700;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding-left: 0.6rem;
  border-left: 2px solid #38bdf8;
}

/* ── Linked conjunction card ──────────────────────── */
.conjunction-card {
  background: #0c1829;
  border: 1px solid #1e3350;
  border-radius: 10px;
  padding: 1.1rem 1.25rem;
}

.conj-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.conj-stat {
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
  font-size: 0.88rem;
  font-weight: 600;
  color: #dde6f0;
  font-family: monospace;
}

.val--danger { color: #f87171; }
</style>
