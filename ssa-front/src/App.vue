<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/layout/App-Header.vue'
</script>

<template>
  <AppHeader />
  <main>
    <RouterView />
  </main>
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
body {
  min-height: 100vh;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #070e20;
  color: #e2e8f0;
}

main {
  min-height: calc(100vh - 60px);
}
</style>
