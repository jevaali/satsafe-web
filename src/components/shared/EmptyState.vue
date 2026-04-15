<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div class="empty-state">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4M12 16h.01"/>
    </svg>
    <p>{{ message ?? 'No data available' }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  color: #3d5a78;
}

svg { opacity: 0.6; }

p {
  font-size: 0.875rem;
  margin: 0;
  color: #7a90a8;
}
</style>
