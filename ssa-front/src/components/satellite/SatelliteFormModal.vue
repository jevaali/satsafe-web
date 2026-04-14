<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import type { ISatelliteListItem, ICreateSatellitePayload, IUpdateSatellitePayload } from '@/domain'
import { useSatelliteStore } from '@/stores/satellite-store'
import { useAuthStore } from '@/stores/auth-store'
import OrbitVisualisation from './OrbitVisualisation.vue'

type Mode = 'add' | 'edit'

const props = defineProps<{
  open: boolean
  mode: Mode
  editTarget?: ISatelliteListItem | null
}>()

const emit = defineEmits<{ close: [] }>()

const satelliteStore = useSatelliteStore()
const authStore = useAuthStore()

const submitting = ref(false)
const error = ref<string | null>(null)

const emptyForm = () => ({
  name: '',
  launchDate: '',
  noradId: '' as unknown as number,
  semiMajorAxis: '' as unknown as number,
  eccentricity: '' as unknown as number,
  inclination: '' as unknown as number,
  raan: '' as unknown as number,
  argumentOfPerigee: '' as unknown as number,
  meanAnomaly: '' as unknown as number,
})

const form = reactive(emptyForm())

watch(
  () => props.open,
  (open) => {
    if (!open) return
    error.value = null
    submitting.value = false
    if (props.mode === 'edit' && props.editTarget) {
      const s = props.editTarget
      Object.assign(form, {
        name: s.name,
        launchDate: s.launchDate ? s.launchDate.split('T')[0] : '',
        noradId: s.noradId,
        semiMajorAxis: s.orbit.semiMajorAxis,
        eccentricity: s.orbit.eccentricity,
        inclination: s.orbit.inclination,
        raan: s.orbit.raan,
        argumentOfPerigee: s.orbit.argumentOfPerigee,
        meanAnomaly: s.orbit.meanAnomaly,
      })
    } else {
      Object.assign(form, emptyForm())
    }
  },
)

const title = computed(() => props.mode === 'add' ? 'Add Satellite' : 'Edit Satellite')

/** Parse validation errors from the backend.
 *  Priority order:
 *  1. ASP.NET ProblemDetails  { errors: { Field: string[] } }
 *  2. Simple messages array   { messages: string[] }
 *  3. Flat validation dict    { Field: string[] }  (no wrapper)
 */
function extractApiError(err: any): string {
  const data = err?.response?.data
  if (!data || typeof data !== 'object') return err?.message ?? 'An error occurred.'

  // { status, error } — backend's standard error envelope
  if (typeof data.error === 'string') return data.error

  // { messages: string[] }
  if (Array.isArray(data.messages) && data.messages.length) return data.messages[0]

  // ASP.NET ProblemDetails { errors: { Field: string[] } }
  if (data.errors && typeof data.errors === 'object') {
    const msgs = (Object.values(data.errors) as unknown[])
      .flat()
      .filter((v): v is string => typeof v === 'string')
    if (msgs.length) return msgs.join(' · ')
  }

  return err?.message ?? 'An error occurred.'
}

/** Build a preview object for the orbit visualiser, only when semiMajorAxis is valid.
 *  Backend stores metres; OrbitVisualisation expects km — divide by 1000. */
const previewSatellite = computed(() => {
  const smaM = Number(form.semiMajorAxis)
  if (!smaM || smaM < 6_500_000) return null
  return {
    id: 'preview',
    name: form.name || 'Preview',
    noradId: Number(form.noradId) || 0,
    orbit: {
      semiMajorAxis: smaM / 1000, // convert m → km for the visualiser
      eccentricity: Math.max(0, Math.min(0.99, Number(form.eccentricity) || 0)),
      inclination: Number(form.inclination) || 0,
      raan: Number(form.raan) || 0,
      argumentOfPerigee: Number(form.argumentOfPerigee) || 0,
      meanAnomaly: Number(form.meanAnomaly) || 0,
    },
    riskLevel: 'unknown',
  }
})

const submit = async () => {
  error.value = null
  submitting.value = true

  const operatorId = authStore.getOperatorId()
  if (!operatorId) {
    error.value = 'Could not resolve operator ID. Please sign in again.'
    submitting.value = false
    return
  }

  try {
    if (props.mode === 'add') {
      const payload: ICreateSatellitePayload = {
        name: form.name,
        launchDate: form.launchDate,
        operatorId,
        noradId: Number(form.noradId),
        semiMajorAxis: Number(form.semiMajorAxis),
        eccentricity: Number(form.eccentricity),
        inclination: Number(form.inclination),
        raan: Number(form.raan),
        argumentOfPerigee: Number(form.argumentOfPerigee),
        meanAnomaly: Number(form.meanAnomaly),
      }
      await satelliteStore.create(payload)
    } else {
      const payload: IUpdateSatellitePayload = {
        satelliteId: props.editTarget!.id,
        name: form.name,
        launchDate: form.launchDate,
        operatorId,
        noradId: Number(form.noradId),
        semiMajorAxis: Number(form.semiMajorAxis),
        eccentricity: Number(form.eccentricity),
        inclination: Number(form.inclination),
        raan: Number(form.raan),
        argumentOfPerigee: Number(form.argumentOfPerigee),
        meanAnomaly: Number(form.meanAnomaly),
      }
      await satelliteStore.update(props.editTarget!.id, payload)
    }
    emit('close')
  } catch (err: any) {
    error.value = extractApiError(err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-panel" role="dialog" :aria-label="title">

        <!-- Header -->
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2a10 10 0 0 1 10 10"/>
                <path d="M12 22a10 10 0 0 1-10-10"/>
                <path d="M2 12a10 10 0 0 1 10-10"/>
                <path d="M22 12a10 10 0 0 1-10 10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="12" y1="2" x2="12" y2="22"/>
              </svg>
            </div>
            <h3 class="modal-title">{{ title }}</h3>
          </div>
          <button class="close-btn" @click="emit('close')" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Split body -->
        <div class="modal-split">

          <!-- ── Left: form ── -->
          <form class="modal-form" @submit.prevent="submit">
            <div v-if="error" class="form-error">{{ error }}</div>

            <div class="form-section-label">Basic Info</div>

            <div class="form-row">
              <div class="form-field">
                <label>Satellite Name</label>
                <input v-model="form.name" type="text" required placeholder="e.g. Aqua" />
              </div>
              <div class="form-field">
                <label>NORAD ID</label>
                <input v-model="form.noradId" type="number" required placeholder="e.g. 27424" />
              </div>
            </div>

            <div class="form-field">
              <label>Launch Date</label>
              <input v-model="form.launchDate" type="date" required />
            </div>

            <div class="form-section-label">Orbital Parameters</div>

            <div class="form-row">
              <div class="form-field">
                <label>Semi-Major Axis (m)</label>
                <input v-model="form.semiMajorAxis" type="number" step="any" required placeholder="6778000" />
              </div>
              <div class="form-field">
                <label>Eccentricity</label>
                <input v-model="form.eccentricity" type="number" step="any" required placeholder="0.0012" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Inclination (°)</label>
                <input v-model="form.inclination" type="number" step="any" required placeholder="98.2" />
              </div>
              <div class="form-field">
                <label>RAAN (°)</label>
                <input v-model="form.raan" type="number" step="any" required placeholder="234.5" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Arg. of Perigee (°)</label>
                <input v-model="form.argumentOfPerigee" type="number" step="any" required placeholder="90.0" />
              </div>
              <div class="form-field">
                <label>Mean Anomaly (°)</label>
                <input v-model="form.meanAnomaly" type="number" step="any" required placeholder="180.0" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" @click="emit('close')">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="submitting">
                {{ submitting ? 'Saving…' : (mode === 'add' ? 'Add Satellite' : 'Save Changes') }}
              </button>
            </div>
          </form>

          <!-- ── Right: orbit preview ── -->
          <div class="orbit-col">
            <div class="orbit-col-header">
              <span class="orbit-col-title">Orbit Preview</span>
              <span v-if="!previewSatellite" class="orbit-col-hint">Enter semi-major axis ≥ 6,500,000 m</span>
              <span v-else class="orbit-col-live">
                <span class="live-dot" />
                Live
              </span>
            </div>
            <div class="orbit-col-body">
              <OrbitVisualisation
                v-if="previewSatellite"
                :satellite="previewSatellite"
                height="100%"
              />
              <div v-else class="orbit-empty">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.35">
                  <circle cx="12" cy="12" r="3"/>
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/>
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/>
                </svg>
                <p>Live orbit preview will appear<br>once orbital parameters are entered</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.70);
  backdrop-filter: blur(6px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* Wide panel with fixed height so orbit preview fills the right column */
.modal-panel {
  background: #0d1a2d;
  border: 1px solid #1a2d4a;
  border-radius: 16px;
  width: 100%;
  max-width: 960px;
  height: min(88vh, 680px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #1a2d4a;
  flex-shrink: 0;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.modal-icon {
  width: 30px;
  height: 30px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  flex-shrink: 0;
}

.modal-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #475569;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  line-height: 0;
}
.close-btn:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }

/* Split layout */
.modal-split {
  flex: 1;
  display: grid;
  grid-template-columns: 420px 1fr;
  min-height: 0;
  overflow: hidden;
}

/* Form column */
.modal-form {
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  border-right: 1px solid #1a2d4a;
}

.modal-form::-webkit-scrollbar { width: 4px; }
.modal-form::-webkit-scrollbar-track { background: transparent; }
.modal-form::-webkit-scrollbar-thumb { background: #1e3a5c; border-radius: 2px; }

.form-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  color: #f87171;
  font-size: 0.82rem;
  padding: 0.7rem 1rem;
}

.form-section-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #38bdf8;
  padding-top: 0.1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.form-field label {
  font-size: 0.72rem;
  font-weight: 500;
  color: #64748b;
}

.form-field input {
  padding: 0.55rem 0.8rem;
  border: 1px solid #1a2d4a;
  border-radius: 7px;
  background: #0a1628;
  color: #e2e8f0;
  font-size: 0.85rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
}

.form-field input::placeholder { color: #2d445f; }

.form-field input:focus {
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.1);
}

/* Footer inside form */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #1a2d4a;
  margin-top: auto;
}

.btn-cancel {
  padding: 0.55rem 1.1rem;
  border-radius: 7px;
  border: 1px solid #1a2d4a;
  background: transparent;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover { color: #94a3b8; background: rgba(255,255,255,0.04); }

.btn-submit {
  padding: 0.55rem 1.25rem;
  border-radius: 7px;
  border: none;
  background: #38bdf8;
  color: #070e20;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.btn-submit:hover:not(:disabled) { background: #7dd3fc; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* Orbit preview column */
.orbit-col {
  display: flex;
  flex-direction: column;
  background: #070e20;
  min-height: 0;
}

.orbit-col-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #1a2d4a;
  flex-shrink: 0;
}

.orbit-col-title {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #38bdf8;
}

.orbit-col-hint {
  font-size: 0.68rem;
  color: #334155;
  margin-left: auto;
}

.orbit-col-live {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.65rem;
  font-weight: 600;
  color: #4ade80;
  letter-spacing: 0.06em;
  margin-left: auto;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

.orbit-col-body {
  flex: 1;
  min-height: 0;
  position: relative;
}

/* Stretch the OrbitVisualisation to fill the column body */
.orbit-col-body :deep(.orbit-viewer) {
  border-radius: 0;
  height: 100% !important;
}

.orbit-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #334155;
}

.orbit-empty svg { color: #253d5e; }

.orbit-empty p {
  font-size: 0.78rem;
  text-align: center;
  line-height: 1.6;
  color: #2d445f;
  margin: 0;
}
</style>
