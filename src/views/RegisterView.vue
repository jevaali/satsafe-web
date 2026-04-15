<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth-store'
import { EOperatorType } from '@/domain'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const error = ref('')
const loading = ref(false)

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const firstname = ref('')
const lastname = ref('')
const operatorName = ref('')
const operatorCountry = ref('')
const operatorType = ref<number>(EOperatorType.Commercial)

const operatorTypeOptions = [
  { label: 'Commercial', value: EOperatorType.Commercial },
  { label: 'Government', value: EOperatorType.Government },
  { label: 'Amateur', value: EOperatorType.Amateur },
  { label: 'Other', value: EOperatorType.NotOneOfTheAbove },
]

const submit = async () => {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true
  try {
    await auth.register(
      email.value, password.value, firstname.value, lastname.value,
      operatorName.value, operatorCountry.value, operatorType.value,
    )
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-card">
      <!-- Brand -->
      <div class="brand">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2a10 10 0 0 1 10 10"/>
            <path d="M12 22a10 10 0 0 1-10-10"/>
            <path d="M2 12a10 10 0 0 1 10-10"/>
            <path d="M22 12a10 10 0 0 1-10 10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <line x1="12" y1="2" x2="12" y2="22"/>
          </svg>
        </div>
        <div>
          <div class="brand-name">SSA Platform</div>
          <div class="brand-sub">Space Situational Awareness</div>
        </div>
      </div>

      <div class="divider" />

      <h2 class="card-title">Create Operator Account</h2>

      <div v-if="error" class="error-banner">{{ error }}</div>

      <form @submit.prevent="submit" class="form">
        <p class="section-label">Account</p>

        <div class="form-row">
          <div class="field">
            <label for="firstname">First Name</label>
            <input id="firstname" v-model="firstname" type="text" required placeholder="Jane" autocomplete="given-name" />
          </div>
          <div class="field">
            <label for="lastname">Last Name</label>
            <input id="lastname" v-model="lastname" type="text" required placeholder="Smith" autocomplete="family-name" />
          </div>
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required placeholder="jane@agency.gov" autocomplete="email" />
        </div>

        <div class="form-row">
          <div class="field">
            <label for="password">Password</label>
            <input id="password" v-model="password" type="password" required placeholder="Min 6 characters" autocomplete="new-password" />
          </div>
          <div class="field">
            <label for="confirm">Confirm Password</label>
            <input id="confirm" v-model="confirmPassword" type="password" required placeholder="Repeat password" autocomplete="new-password" />
          </div>
        </div>

        <div class="divider" />
        <p class="section-label">Operator Details</p>

        <div class="field">
          <label for="operatorName">Operator Name</label>
          <input id="operatorName" v-model="operatorName" type="text" required placeholder="e.g. European Space Agency" />
        </div>

        <div class="form-row">
          <div class="field">
            <label for="country">Country Code</label>
            <input id="country" v-model="operatorCountry" type="text" required placeholder="e.g. EE" maxlength="5" />
          </div>
          <div class="field">
            <label for="opType">Operator Type</label>
            <select id="opType" v-model="operatorType" required>
              <option v-for="opt in operatorTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="spinner" />
          {{ loading ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <div class="divider" />

      <p class="footer-text">
        Already have an account?
        <router-link to="/login">Sign in here</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #070e20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.register-card {
  width: 100%;
  max-width: 500px;
  background: #0d1a2d;
  border: 1px solid #1a2d4a;
  border-radius: 16px;
  padding: 2.25rem 2.5rem;
  box-shadow: 0 16px 48px rgba(0,0,0,0.45);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  flex-shrink: 0;
}

.brand-name {
  font-size: 1rem;
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: 0.04em;
}

.brand-sub {
  font-size: 0.65rem;
  color: #475569;
  letter-spacing: 0.03em;
}

.divider { height: 1px; background: #1a2d4a; }

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
}

.error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  color: #f87171;
  font-size: 0.82rem;
  padding: 0.7rem 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.section-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #38bdf8;
  margin: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
}

.field input,
.field select {
  padding: 0.65rem 0.9rem;
  border: 1px solid #1a2d4a;
  border-radius: 8px;
  background: #0a1628;
  color: #e2e8f0;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field input::placeholder { color: #334155; }

.field input:focus,
.field select:focus {
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.1);
}

.field select option { background: #0d1a2d; }

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  background: #38bdf8;
  color: #070e20;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.submit-btn:hover:not(:disabled) { background: #7dd3fc; }
.submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(7, 14, 32, 0.3);
  border-top-color: #070e20;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.footer-text {
  text-align: center;
  font-size: 0.8rem;
  color: #475569;
  margin: 0;
}

.footer-text a { color: #38bdf8; text-decoration: none; }
.footer-text a:hover { color: #7dd3fc; }

@media (max-width: 480px) {
  .register-card { padding: 1.75rem; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
