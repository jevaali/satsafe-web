<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { TleService } from '@/services/api-services/TleService'
import type { ITle } from '@/domain'

const props = defineProps<{
  tle?: ITle
  satelliteId: string
}>()

const emit = defineEmits<{ (e: 'updated'): void }>()

const formOpen = ref(false)
const line1 = ref('')
const line2 = ref('')
const submitting = ref(false)
const error = ref('')

const TLE_LINE_LENGTH = 69

const openForm = () => {
  line1.value = props.tle?.rawLine1 ?? ''
  line2.value = props.tle?.rawLine2 ?? ''
  error.value = ''
  formOpen.value = true
}

const cancelForm = () => {
  formOpen.value = false
  error.value = ''
}

const validateLine = (line: string): boolean => line.trim().length === TLE_LINE_LENGTH

const submit = async () => {
  error.value = ''

  if (!validateLine(line1.value)) {
    error.value = 'Line 1 must be exactly 69 characters.'
    return
  }
  if (!validateLine(line2.value)) {
    error.value = 'Line 2 must be exactly 69 characters.'
    return
  }

  submitting.value = true
  try {
    await TleService.addManually(props.satelliteId, {
      satelliteId: props.satelliteId,
      rawLine1: line1.value.trim(),
      rawLine2: line2.value.trim(),
    })
    formOpen.value = false
    emit('updated')
  } catch (e: unknown) {
    if (axios.isAxiosError(e) && e.response?.data?.error) {
      error.value = e.response.data.error
    } else {
      error.value = e instanceof Error ? e.message : 'Failed to save TLE.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
      <h2 class="panel-title">TLE Data</h2>
      <button class="add-btn" @click="openForm">
        {{ tle ? 'Update TLE' : 'Add TLE' }}
      </button>
    </div>

    <!-- Display current TLE -->
    <div v-if="tle" class="tle-body">
      <div class="tle-row">
        <span class="tle-label">Line 1</span>
        <code class="tle-value">{{ tle.rawLine1 }}</code>
      </div>
      <div class="tle-row">
        <span class="tle-label">Line 2</span>
        <code class="tle-value">{{ tle.rawLine2 }}</code>
      </div>
    </div>

    <div v-else class="tle-empty">
      <span>No TLE data available.</span>
    </div>

    <!-- Inline add/edit form -->
    <div v-if="formOpen" class="tle-form">
      <div class="form-field">
        <label class="field-label">Line 1 <span class="char-count">{{ line1.trim().length }}/69</span></label>
        <textarea
          v-model="line1"
          class="tle-input"
          rows="2"
          placeholder="1 NNNNNC NNNNNAAA NNNNN.NNNNNNNN +.NNNNNNNN +NNNNN-N +NNNNN-N N NNNNN"
          spellcheck="false"
          autocomplete="off"
        />
      </div>
      <div class="form-field">
        <label class="field-label">Line 2 <span class="char-count">{{ line2.trim().length }}/69</span></label>
        <textarea
          v-model="line2"
          class="tle-input"
          rows="2"
          placeholder="2 NNNNN NNN.NNNN NNN.NNNN NNNNNNN NNN.NNNN NNN.NNNN NN.NNNNNNNNNNNNNN"
          spellcheck="false"
          autocomplete="off"
        />
      </div>
      <p v-if="error" class="form-error">{{ error }}</p>
      <div class="form-actions">
        <button class="btn-cancel" @click="cancelForm">Cancel</button>
        <button class="btn-save" :disabled="submitting" @click="submit">
          {{ submitting ? 'Saving…' : 'Save TLE' }}
        </button>
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
  font-size: 0.78rem;
  font-weight: 700;
  color: #b0c4d8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
  flex: 1;
}

.add-btn {
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #1e3a58;
  background: rgba(56, 139, 253, 0.08);
  color: #60a5fa;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.add-btn:hover {
  background: rgba(56, 139, 253, 0.15);
  border-color: #2d6bb8;
}

.tle-body {
  display: flex;
  flex-direction: column;
}

.tle-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #1e3350;
}

.tle-row:last-child {
  border-bottom: none;
}

.tle-label {
  font-size: 0.68rem;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 600;
}

.tle-value {
  font-size: 0.8rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #94d2ff;
  word-break: break-all;
  white-space: pre-wrap;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.4rem 0.6rem;
  border-radius: 5px;
  border: 1px solid #1a2d45;
}

.tle-empty {
  padding: 1.25rem;
  font-size: 0.82rem;
  color: #4a6072;
  font-style: italic;
}

.tle-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #1e3350;
  background: #0a1525;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.68rem;
  color: #7a90a8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.char-count {
  font-size: 0.65rem;
  color: #4a6072;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
}

.tle-input {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.78rem;
  color: #e2e8f0;
  background: #0d1a2d;
  border: 1px solid #1e3350;
  border-radius: 7px;
  padding: 0.6rem 0.75rem;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}

.tle-input:focus {
  border-color: #2d6bb8;
}

.form-error {
  font-size: 0.78rem;
  color: #f87171;
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.btn-cancel {
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  border: 1px solid #1a2d4a;
  background: transparent;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.04);
}

.btn-save {
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  border: 1px solid #1e4a80;
  background: rgba(56, 139, 253, 0.12);
  color: #60a5fa;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-save:hover:not(:disabled) {
  background: rgba(56, 139, 253, 0.22);
  border-color: #2563b8;
}

.btn-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
