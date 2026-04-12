<script setup lang="ts">
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="app-header">
    <div class="header-inner">

      <!-- Brand -->
      <router-link to="/" class="brand">
        <svg class="brand-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Orbit ring -->
          <ellipse cx="16" cy="16" rx="14" ry="6" stroke="#38bdf8" stroke-width="1.5" fill="none" />
          <!-- Vertical orbit -->
          <ellipse cx="16" cy="16" rx="6" ry="14" stroke="#38bdf8" stroke-width="1.5" fill="none" opacity="0.5"/>
          <!-- Center planet -->
          <circle cx="16" cy="16" r="4" fill="#38bdf8" />
          <!-- Satellite dot -->
          <circle cx="29" cy="12" r="2" fill="#7dd3fc" />
        </svg>
        <span class="brand-name">
          <span class="brand-ssa">SSA</span>
          <span class="brand-sub">Platform</span>
        </span>
      </router-link>

      <!-- Navigation -->
      <nav class="nav">
        <template v-if="!auth.isAuthenticated">
          <router-link to="/login" class="nav-btn nav-btn--outline">
            Sign In
          </router-link>
          <router-link to="/register" class="nav-btn nav-btn--primary">
            Register
          </router-link>
        </template>

        <template v-else>
          <span class="nav-user">
            <span class="nav-user-dot"></span>
            {{ auth.user?.email }}
          </span>
          <button class="nav-btn nav-btn--outline" @click="logout">
            Sign Out
          </button>
        </template>
      </nav>

    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: #060d1f;
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
  backdrop-filter: blur(8px);
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-icon {
  width: 32px;
  height: 32px;
}

.brand-name {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-ssa {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #f0f9ff;
}

.brand-sub {
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #38bdf8;
}

/* Nav */
.nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1.1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  font-family: inherit;
}

.nav-btn--outline {
  background: transparent;
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #7dd3fc;
}

.nav-btn--outline:hover {
  background: rgba(56, 189, 248, 0.08);
  border-color: #38bdf8;
  color: #e0f2fe;
}

.nav-btn--primary {
  background: #0284c7;
  border: 1px solid #0284c7;
  color: #f0f9ff;
}

.nav-btn--primary:hover {
  background: #0369a1;
  border-color: #0369a1;
}

/* Authenticated user */
.nav-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #94a3b8;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-user-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .brand-sub {
    display: none;
  }

  .nav-user {
    display: none;
  }

  .header-inner {
    padding: 0 1rem;
  }
}
</style>
