<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSatelliteStore } from '@/stores/satellite-store'
import { ESatelliteStatus } from '@/domain'
import SatelliteFormModal from '@/components/satellite/SatelliteFormModal.vue'

const router = useRouter()
const route = useRoute()
const satelliteStore = useSatelliteStore()

const visible = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const show = () => {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
  visible.value = true
}

const scheduleHide = () => {
  hideTimer = setTimeout(() => { visible.value = false }, 200)
}

onMounted(() => {
  if (satelliteStore.satellites.length === 0) {
    satelliteStore.fetchList()
  }
})

const activeSatelliteId = computed(() => route.params.id as string | undefined)

const statusDotClass = (status: ESatelliteStatus) => {
  if (status === ESatelliteStatus.Active) return 'dot--active'
  if (status === ESatelliteStatus.Inactive) return 'dot--inactive'
  return 'dot--muted'
}

const navigateTo = (path: string) => {
  router.push(path)
  visible.value = false
}

const showAddModal = ref(false)

const openAddModal = () => {
  showAddModal.value = true
}
</script>

<template>
  <!-- Hover trigger strip (always visible, 8px wide) -->
  <div class="sidebar-trigger" @mouseenter="show" @mouseleave="scheduleHide" />

  <!-- Sidebar panel -->
  <aside
    class="sidebar"
    :class="{ 'sidebar--visible': visible }"
    @mouseenter="show"
    @mouseleave="scheduleHide"
  >
    <!-- Brand -->
    <div class="sidebar-brand">
      <div class="brand-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
          <path d="M12 22a10 10 0 0 1-10-10"/>
          <path d="M2 12a10 10 0 0 1 10-10"/>
          <path d="M22 12a10 10 0 0 1-10 10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">SSA</span>
        <span class="brand-sub">Space Situational Awareness</span>
      </div>
    </div>

    <div class="sidebar-divider" />

    <!-- Main nav -->
    <nav class="sidebar-nav">
      <button
        class="nav-item"
        :class="{ 'nav-item--active': route.name === 'Home' }"
        @click="navigateTo('/')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>Overview</span>
      </button>
    </nav>

    <div class="sidebar-divider" />

    <!-- Satellites list -->
    <div class="satellites-section">
      <p class="section-label">Satellites</p>

      <div v-if="satelliteStore.loading" class="loading-rows">
        <div class="skeleton-row" v-for="i in 4" :key="i" />
      </div>

      <div v-else-if="satelliteStore.satellites.length === 0" class="empty-label">
        No satellites registered
      </div>

      <div v-else class="satellite-list">
        <button
          v-for="sat in satelliteStore.satellites"
          :key="sat.id"
          class="satellite-item"
          :class="{ 'satellite-item--active': activeSatelliteId === sat.id }"
          @click="navigateTo(`/satellites/${sat.id}`)"
        >
          <span class="sat-dot" :class="statusDotClass(sat.status)" />
          <span class="sat-name">{{ sat.name }}</span>
          <span class="sat-norad">#{{ sat.noradId }}</span>
        </button>
      </div>
    </div>

    <!-- Add satellite -->
    <div class="sidebar-add">
      <button class="btn-add-satellite" @click="openAddModal">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add Satellite</span>
      </button>
    </div>

    <!-- Bottom -->
    <div class="sidebar-bottom">
      <div class="sidebar-divider" />
      <button class="nav-item nav-item--muted" disabled>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
        <span>Settings</span>
      </button>
    </div>
  </aside>

  <SatelliteFormModal
    :open="showAddModal"
    mode="add"
    @close="showAddModal = false"
  />
</template>

<style scoped>
/* Trigger strip — always present, 8px wide on the left edge */
.sidebar-trigger {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  z-index: 200;
  cursor: pointer;
}

/* Sidebar panel */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 264px;
  background: #0c1829;
  border-right: 1px solid #1e3350;
  z-index: 199;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 32px rgba(0,0,0,0.5);
  overflow: hidden;
}

.sidebar--visible {
  transform: translateX(0);
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.25rem 1rem;
  flex-shrink: 0;
}

.brand-icon {
  width: 36px;
  height: 36px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.brand-name {
  font-size: 1rem;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: 0.1em;
}

.brand-sub {
  font-size: 0.62rem;
  color: #7a90a8;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.sidebar-divider {
  height: 1px;
  background: #1e3350;
  margin: 0 1.25rem;
  flex-shrink: 0;
}

/* Nav */
.sidebar-nav {
  padding: 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #8fa0b8;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.08);
  color: #b8cad9;
}

.nav-item--active {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
}

.nav-item--muted {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Satellites section */
.satellites-section {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.75rem 0;
  min-height: 0;
}

.satellites-section::-webkit-scrollbar { width: 4px; }
.satellites-section::-webkit-scrollbar-track { background: transparent; }
.satellites-section::-webkit-scrollbar-thumb { background: #253d5e; border-radius: 2px; }

.section-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #7a90a8;
  padding: 0 1.25rem 0.5rem;
  margin: 0;
}

.satellite-list {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0 0.75rem;
}

.satellite-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.15s;
}

.satellite-item:hover {
  background: rgba(255,255,255,0.05);
}

.satellite-item--active {
  background: rgba(56, 189, 248, 0.1);
}

.sat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot--active   { background: #4ade80; box-shadow: 0 0 5px #4ade80; }
.dot--inactive { background: #fbbf24; }
.dot--muted    { background: #7a90a8; }

.sat-name {
  flex: 1;
  font-size: 0.82rem;
  font-weight: 500;
  color: #b0c4d8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.satellite-item--active .sat-name { color: #f1f5f9; }

.sat-norad {
  font-size: 0.68rem;
  color: #7a90a8;
  flex-shrink: 0;
}

/* Loading skeletons */
.loading-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
}

.skeleton-row {
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(90deg, #0c1829 25%, #1e3350 50%, #0c1829 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.empty-label {
  font-size: 0.8rem;
  color: #7a90a8;
  padding: 0.5rem 1.25rem;
}

/* Bottom section */
.sidebar-bottom {
  flex-shrink: 0;
  padding-bottom: 0.75rem;
}

.sidebar-bottom .sidebar-divider {
  margin-bottom: 0.5rem;
}

.sidebar-bottom .nav-item {
  margin: 0 0.75rem;
}

/* Add satellite button */
.sidebar-add {
  flex-shrink: 0;
  padding: 0.5rem 0.75rem 0.75rem;
}

.btn-add-satellite {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border: 1px dashed rgba(56, 189, 248, 0.25);
  background: rgba(56, 189, 248, 0.04);
  color: #38bdf8;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.btn-add-satellite:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.45);
  color: #7dd3fc;
}

.btn-add-satellite svg {
  flex-shrink: 0;
  opacity: 0.8;
}
</style>
