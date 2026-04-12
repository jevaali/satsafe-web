<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth-store'
import { EOperatorType } from '../domain/IUser'
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
      email.value,
      password.value,
      firstname.value,
      lastname.value,
      operatorName.value,
      operatorCountry.value,
      operatorType.value,
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
  <div class="register-container">
    <div class="register-wrapper">
      <div class="register-card">
        <div class="card-body">
          <h2 class="text-center mb-2">Create Account</h2>
          <hr>
          <div v-if="error" class="alert alert-danger" role="alert">
            {{ error }}
          </div>

          <form @submit.prevent="submit" class="register-form">
            <div class="form-row">
              <div class="form-group">
                <label for="firstname" class="form-label">First Name</label>
                <input
                  id="firstname"
                  v-model="firstname"
                  type="text"
                  class="form-control"
                  placeholder="Enter first name"
                  required
                  autocomplete="given-name"
                />
              </div>

              <div class="form-group">
                <label for="lastname" class="form-label">Last Name</label>
                <input
                  id="lastname"
                  v-model="lastname"
                  type="text"
                  class="form-control"
                  placeholder="Enter last name"
                  required
                  autocomplete="family-name"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Email address</label>
              <input
                id="email"
                v-model="email"
                type="email"
                class="form-control"
                :class="{ 'is-invalid': error && error.includes('Registration') }"
                placeholder="Enter your email"
                required
                autocomplete="email"
              />
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                v-model="password"
                type="password"
                class="form-control"
                :class="{
                  'is-invalid':
                    error && !error.includes('Registration') && error.includes('Password'),
                }"
                placeholder="Create a password (min 6 characters)"
                required
                autocomplete="new-password"
              />
            </div>

            <div class="form-group">
              <label for="confirmPassword" class="form-label">Confirm Password</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                class="form-control"
                :class="{ 'is-invalid': error && error.includes('match') }"
                placeholder="Confirm your password"
                required
                autocomplete="new-password"
              />
            </div>

            <hr class="section-divider" />
            <p class="section-label">Operator Details</p>

            <div class="form-group">
              <label for="operatorName" class="form-label">Operator Name</label>
              <input
                id="operatorName"
                v-model="operatorName"
                type="text"
                class="form-control"
                placeholder="Enter operator name"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="operatorCountry" class="form-label">Country</label>
                <input
                  id="operatorCountry"
                  v-model="operatorCountry"
                  type="text"
                  class="form-control"
                  placeholder="e.g. EE"
                  required
                />
              </div>

              <div class="form-group">
                <label for="operatorType" class="form-label">Operator Type</label>
                <select id="operatorType" v-model="operatorType" class="form-control" required>
                  <option v-for="opt in operatorTypeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="button-container">
              <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {{ loading ? 'Creating account...' : 'Create Account' }}
              </button>
            </div>
          </form>

          <hr class="my-4" />

          <p class="text-center mb-0">
            Already have an account?
            <router-link to="/login" class="text-decoration-none">Sign in here</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.register-wrapper {
  width: 100%;
  max-width: 540px;
}

.register-card {
  background: #0d1a2e;
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.card-body {
  padding: 2.5rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 500;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-control {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  background: #0a1628;
  color: #e2e8f0;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-control::placeholder {
  color: #475569;
}

.form-control:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 0.2rem rgba(56, 189, 248, 0.12);
  outline: none;
}

.button-container {
  margin-top: 0.5rem;
}

.btn-primary {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-weight: 500;
  font-size: 1rem;
  border-radius: 8px;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0b5ed7;
}

.btn-primary:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.alert-danger {
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
}

hr {
  border-color: rgba(56, 189, 248, 0.1);
}

.section-divider {
  margin: 0.25rem 0;
  border-color: rgba(56, 189, 248, 0.1);
}

.section-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

h2 {
  color: #f0f9ff;
}

p {
  color: #64748b;
}

a {
  color: #38bdf8;
}

a:hover {
  color: #7dd3fc;
}

@media (max-width: 575.98px) {
  .card-body {
    padding: 1.75rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .register-wrapper {
    max-width: 100%;
  }
}

@media (min-width: 992px) {
  .card-body {
    padding: 3rem;
  }

  .register-wrapper {
    max-width: 580px;
  }
}
</style>
