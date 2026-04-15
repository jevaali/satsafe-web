<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const route = useRoute()
const auth = useAuthStore()

const showShell = computed(() => auth.isAuthenticated && !route.meta.requiresGuest)
</script>

<template>
  <template v-if="!showShell">
    <RouterView />
  </template>

  <div v-else class="app-shell">
    <AppSidebar />
    <div class="app-main">
      <AppHeader />
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>





<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  height: 100%;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #070e20;
  color: #dde6f0;
}

.app-shell {
  height: 100vh;
  overflow: hidden;
  display: flex;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #070e20;
}

.main-content::-webkit-scrollbar { width: 6px; }
.main-content::-webkit-scrollbar-track { background: transparent; }
.main-content::-webkit-scrollbar-thumb { background: #1e3350; border-radius: 3px; }
</style>
