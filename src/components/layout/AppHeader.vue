<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const pageTitle = computed(() => {
  if (route.name === 'Home') return 'Fleet Overview'
  if (route.name === 'Satellite') {
    const name = route.params.name as string
    return name ? decodeURIComponent(name) : 'Satellite'
  }
  return String(route.name ?? 'SSA Platform')
})

// User initials from stored user or fallback
const userInitials = computed(() => {
  const u = auth.user
  if (u?.firstName && u?.lastName) return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()
  if (u?.email) return (u.email[0] ?? 'O').toUpperCase()
  return 'OP'
})

const logout = async () => {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

    <div class="header-right">
      <div class="live-indicator">
        <span class="live-dot" />
        <span class="live-text">Live</span>
      </div>

      <div class="user-chip">
        <div class="user-avatar">{{ userInitials }}</div>
      </div>

      <button class="logout-btn" title="Sign out" @click="logout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 1.5rem;
  background: #0c1829;
  border-bottom: 1px solid #1e3350;
  flex-shrink: 0;
  gap: 1rem;
}

.page-title {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

/* Live indicator */
.live-indicator {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4ade80;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.live-dot {
  width: 7px;
  height: 7px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse 2s infinite;
  box-shadow: 0 0 6px #4ade80;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

/* User */
.user-avatar {
  width: 30px;
  height: 30px;
  background: #1a3a5c;
  border: 1px solid #253d5e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.04em;
}

/* Logout */
.logout-btn {
  background: none;
  border: none;
  color: #7a90a8;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.15s, background 0.15s;
}

.logout-btn:hover {
  color: #f1f5f9;
  background: rgba(255,255,255,0.07);
}
</style>
