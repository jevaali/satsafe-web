<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
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

      <h2 class="card-title">Operator Sign In</h2>

      <div v-if="error" class="error-banner">{{ error }}</div>

      <form @submit.prevent="submit" class="form">
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email" v-model="email" type="email" required
            placeholder="operator@agency.gov" autocomplete="email"
          />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password" v-model="password" type="password" required
            placeholder="Enter your password" autocomplete="current-password"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="spinner" />
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <div class="divider" />

      <p class="footer-text">
        No account?
        <router-link to="/register">Register here</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #070e20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #0f1e35;
  border: 1px solid #1e3350;
  border-top: 2px solid #38bdf8;
  border-radius: 16px;
  padding: 2.25rem 2.5rem;
  box-shadow: 0 24px 64px rgba(0,0,0,0.55);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
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
  color: #f1f5f9;
  letter-spacing: 0.04em;
}

.brand-sub {
  font-size: 0.65rem;
  color: #7a90a8;
  letter-spacing: 0.03em;
}

.divider { height: 1px; background: #1e3350; }

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
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
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #8fa0b8;
}

.field input {
  padding: 0.7rem 0.95rem;
  border: 1px solid #1e3350;
  border-radius: 8px;
  background: #0c1829;
  color: #f1f5f9;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field input::placeholder { color: #3d5a78; }

.field input:focus {
  border-color: rgba(56, 189, 248, 0.45);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
}

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
  color: #7a90a8;
  margin: 0;
}

.footer-text a { color: #38bdf8; text-decoration: none; }
.footer-text a:hover { color: #7dd3fc; }
</style>
