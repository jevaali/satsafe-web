<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings-store'
import { EOperatorType } from '@/domain/ISettings'

const store = useSettingsStore()

onMounted(() => {
  store.fetchSettings()
})

// ── Operator ──────────────────────────────────────────────────────────────────
const editingOperator = ref(false)
const operatorForm = ref({ name: '', country: '', operatorType: EOperatorType.Commercial })

const openOperatorEdit = () => {
  const op = store.operator
  if (!op) return
  operatorForm.value = { name: op.name, country: op.countryCode, operatorType: op.operatorType }
  editingOperator.value = true
}

const saveOperator = async () => {
  await store.updateOperator(operatorForm.value)
  editingOperator.value = false
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const helperEmail = ref('')
const addingHelper = ref(false)

const submitAddHelper = async () => {
  if (!helperEmail.value.trim()) return
  addingHelper.value = true
  try {
    await store.addHelper({ email: helperEmail.value.trim() })
    helperEmail.value = ''
  } finally {
    addingHelper.value = false
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────
const editingNotif = ref(false)
const notifForm = ref({ conjunctionThresholdKm: 0, alertThresholdKm: 0, emailEnabled: false, smsEnabled: false })

const openNotifEdit = () => {
  const n = store.notificationSetting
  notifForm.value = n
    ? { ...n }
    : { conjunctionThresholdKm: 10, alertThresholdKm: 5, emailEnabled: true, smsEnabled: true }
  editingNotif.value = true
}

const saveNotif = async () => {
  await store.saveNotifications(notifForm.value)
  editingNotif.value = false
}

// ── Action logs ───────────────────────────────────────────────────────────────
const logFilterUserId = ref('')
const showLogs = ref(false)

const loadLogs = async () => {
  showLogs.value = true
  await store.fetchActionLogs(logFilterUserId.value || undefined)
}

const operatorTypeLabel = (t: EOperatorType) => {
  const map: Record<EOperatorType, string> = {
    [EOperatorType.Government]: 'Government',
    [EOperatorType.Commercial]: 'Commercial',
    [EOperatorType.Amateur]: 'Amateur',
    [EOperatorType.NotOneOfTheAbove]: 'Other',
  }
  return map[t] ?? t
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <div class="settings-page">
    <header class="page-header">
      <h1 class="page-title">Settings</h1>
    </header>

    <div v-if="store.loading && !store.settings" class="loading-state">
      <div class="skeleton-block" v-for="i in 3" :key="i" />
    </div>

    <template v-else-if="store.settings">
      <!-- Operator -->
      <section class="card">
        <div class="card-header">
          <h2 class="card-title">Operator</h2>
          <button class="btn-secondary" @click="openOperatorEdit" :disabled="editingOperator">Edit</button>
        </div>

        <template v-if="!editingOperator">
          <dl class="detail-list">
            <div class="detail-row">
              <dt>Name</dt>
              <dd>{{ store.operator?.name }}</dd>
            </div>
            <div class="detail-row">
              <dt>Country</dt>
              <dd>{{ store.operator?.countryCode }}</dd>
            </div>
            <div class="detail-row">
              <dt>Type</dt>
              <dd>{{ operatorTypeLabel(store.operator!.operatorType) }}</dd>
            </div>
          </dl>
        </template>

        <template v-else>
          <form class="settings-form" @submit.prevent="saveOperator">
            <div class="field">
              <label>Name</label>
              <input v-model="operatorForm.name" class="input" required />
            </div>
            <div class="field">
              <label>Country code</label>
              <input v-model="operatorForm.country" class="input" placeholder="e.g. US" required />
            </div>
            <div class="field">
              <label>Type</label>
              <select v-model="operatorForm.operatorType" class="input">
                <option :value="EOperatorType.Government">Government</option>
                <option :value="EOperatorType.Commercial">Commercial</option>
                <option :value="EOperatorType.Amateur">Amateur</option>
                <option :value="EOperatorType.NotOneOfTheAbove">Other</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="store.actionLoading">Save</button>
              <button type="button" class="btn-ghost" @click="editingOperator = false">Cancel</button>
            </div>
          </form>
        </template>

        <p v-if="store.error" class="error-msg">{{ store.error }}</p>
      </section>

      <!-- Helpers -->
      <section class="card">
        <div class="card-header">
          <h2 class="card-title">Helpers</h2>
        </div>

        <div v-if="store.helpers.length === 0" class="empty-label">No helpers added yet.</div>
        <ul v-else class="helper-list">
          <li v-for="h in store.helpers" :key="h.id" class="helper-item">
            <div class="helper-info">
              <span class="helper-name">{{ h.fullName }}</span>
              <span class="helper-email">{{ h.email }}</span>
            </div>
            <button
              class="btn-danger-sm"
              :disabled="store.actionLoading"
              @click="store.removeHelper(h.id)"
            >Remove</button>
          </li>
        </ul>

        <form class="add-helper-form" @submit.prevent="submitAddHelper">
          <input
            v-model="helperEmail"
            class="input"
            type="email"
            placeholder="helper@example.com"
            required
          />
          <button type="submit" class="btn-primary" :disabled="addingHelper || store.actionLoading">
            {{ addingHelper ? 'Adding…' : 'Add Helper' }}
          </button>
        </form>
      </section>

      <!-- Notifications -->
      <section class="card">
        <div class="card-header">
          <h2 class="card-title">Notifications</h2>
          <button class="btn-secondary" @click="openNotifEdit" :disabled="editingNotif">Edit</button>
        </div>

        <template v-if="!editingNotif">
          <dl class="detail-list">
            <div class="detail-row">
              <dt>Conjunction threshold</dt>
              <dd>{{ store.notificationSetting?.conjunctionThresholdKm }} km</dd>
            </div>
            <div class="detail-row">
              <dt>Alert threshold</dt>
              <dd>{{ store.notificationSetting?.alertThresholdKm }} km</dd>
            </div>
            <div class="detail-row">
              <dt>Email alerts</dt>
              <dd>{{ store.notificationSetting?.emailEnabled ? 'Enabled' : 'Disabled' }}</dd>
            </div>
            <div class="detail-row">
              <dt>SMS alerts</dt>
              <dd>{{ store.notificationSetting?.smsEnabled ? 'Enabled' : 'Disabled' }}</dd>
            </div>
          </dl>
        </template>

        <template v-else>
          <form class="settings-form" @submit.prevent="saveNotif">
            <div class="field">
              <label>Conjunction threshold (km)</label>
              <input v-model.number="notifForm.conjunctionThresholdKm" class="input" type="number" min="0" required />
            </div>
            <div class="field">
              <label>Alert threshold (km)</label>
              <input v-model.number="notifForm.alertThresholdKm" class="input" type="number" min="0" required />
            </div>
            <div class="toggle-row">
              <label class="toggle-label">
                <input type="checkbox" v-model="notifForm.emailEnabled" class="toggle-check" />
                Email alerts
              </label>
              <label class="toggle-label">
                <input type="checkbox" v-model="notifForm.smsEnabled" class="toggle-check" />
                SMS alerts
              </label>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="store.actionLoading">Save</button>
              <button type="button" class="btn-ghost" @click="editingNotif = false">Cancel</button>
            </div>
          </form>
        </template>
      </section>

      <!-- Action logs -->
      <section class="card">
        <div class="card-header">
          <h2 class="card-title">Action Logs</h2>
        </div>

        <div class="log-controls">
          <input
            v-model="logFilterUserId"
            class="input input--sm"
            placeholder="Filter by user ID (optional)"
          />
          <button class="btn-secondary" @click="loadLogs" :disabled="store.loading">Load Logs</button>
        </div>

        <div v-if="store.loading && showLogs" class="empty-label">Loading…</div>

        <template v-else-if="showLogs">
          <div v-if="store.actionLogs.length === 0" class="empty-label">No logs found.</div>
          <div v-else class="log-table-wrapper">
            <table class="log-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Occurred at</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(log, i) in store.actionLogs" :key="i">
                  <td>
                    <span class="log-user">{{ log.userName }}</span>
                    <span class="log-email">{{ log.userEmail }}</span>
                  </td>
                  <td>{{ log.action }}</td>
                  <td class="log-date">{{ formatDate(log.occurredAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}

/* Cards */
.card {
  background: #0c1829;
  border: 1px solid #1e3350;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  letter-spacing: 0.01em;
}

/* Detail list */
.detail-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
}

.detail-row {
  display: flex;
  gap: 1rem;
}

.detail-row dt {
  width: 180px;
  flex-shrink: 0;
  font-size: 0.82rem;
  color: #7a90a8;
}

.detail-row dd {
  font-size: 0.82rem;
  color: #b8cad9;
  margin: 0;
}

/* Form */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field label {
  font-size: 0.78rem;
  color: #7a90a8;
  font-weight: 500;
}

.input {
  background: #0a1220;
  border: 1px solid #1e3350;
  border-radius: 7px;
  color: #e2eaf3;
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  border-color: #38bdf8;
}

.input--sm {
  width: 260px;
}

.toggle-row {
  display: flex;
  gap: 1.5rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.83rem;
  color: #b8cad9;
  cursor: pointer;
}

.toggle-check {
  accent-color: #38bdf8;
  width: 15px;
  height: 15px;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

/* Helpers */
.helper-list {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.helper-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid #1e3350;
  border-radius: 8px;
}

.helper-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.helper-name {
  font-size: 0.84rem;
  color: #e2eaf3;
  font-weight: 500;
}

.helper-email {
  font-size: 0.75rem;
  color: #7a90a8;
}

.add-helper-form {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.add-helper-form .input {
  flex: 1;
}

/* Log controls */
.log-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}

.log-table-wrapper {
  overflow-x: auto;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.log-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  color: #7a90a8;
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-bottom: 1px solid #1e3350;
}

.log-table td {
  padding: 0.55rem 0.75rem;
  color: #b8cad9;
  border-bottom: 1px solid rgba(30, 51, 80, 0.5);
  vertical-align: middle;
}

.log-user {
  display: block;
  color: #e2eaf3;
  font-weight: 500;
}

.log-email {
  display: block;
  font-size: 0.72rem;
  color: #7a90a8;
}

.log-date {
  white-space: nowrap;
  color: #7a90a8;
}

/* Buttons */
.btn-primary {
  background: #38bdf8;
  color: #0a1220;
  border: none;
  border-radius: 7px;
  padding: 0.5rem 1.1rem;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) { background: #7dd3fc; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: rgba(56, 189, 248, 0.08);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 7px;
  padding: 0.45rem 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-secondary:hover:not(:disabled) { background: rgba(56, 189, 248, 0.15); }
.btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-ghost {
  background: transparent;
  color: #7a90a8;
  border: 1px solid #1e3350;
  border-radius: 7px;
  padding: 0.5rem 1rem;
  font-size: 0.83rem;
  cursor: pointer;
  transition: color 0.15s;
}

.btn-ghost:hover { color: #b8cad9; }

.btn-danger-sm {
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.25);
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-danger-sm:hover:not(:disabled) { background: rgba(248, 113, 113, 0.2); }
.btn-danger-sm:disabled { opacity: 0.4; cursor: not-allowed; }

/* Misc */
.empty-label {
  font-size: 0.82rem;
  color: #7a90a8;
  padding: 0.25rem 0;
}

.error-msg {
  font-size: 0.8rem;
  color: #f87171;
  margin: 0.75rem 0 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-block {
  height: 140px;
  border-radius: 12px;
  background: linear-gradient(90deg, #0c1829 25%, #1e3350 50%, #0c1829 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
