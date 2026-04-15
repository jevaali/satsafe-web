<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="content">
      <div class="code">404</div>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <button @click="router.push('/')">← Back to Fleet Overview</button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.code {
  font-size: 5rem;
  font-weight: 900;
  color: #1e3350;
  line-height: 1;
  letter-spacing: -0.02em;
}

h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #7a90a8;
  margin: 0;
}

p {
  font-size: 0.875rem;
  color: #3d5a78;
  margin: 0;
  max-width: 300px;
}

button {
  margin-top: 0.75rem;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  border: 1px solid #1e3350;
  background: transparent;
  color: #7a90a8;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}

button:hover { color: #b0c4d8; border-color: #253d5e; }
</style>
