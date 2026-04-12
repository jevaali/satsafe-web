<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="not-found-view">
    <div class="content-wrapper">
      <div class="error-container">
        <div class="error-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </div>
        <h1 class="error-code">404</h1>
        <h2 class="error-title">Page Not Found</h2>
        <p class="error-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="actions">
          <button @click="goHome" class="btn-home">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 180px);
  padding: 24px;
}

.content-wrapper {
  text-align: center;
  max-width: 480px;
}

.error-container {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 48px 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.error-icon {
  color: #9e9e9e;
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.error-code {
  font-size: 72px;
  font-weight: 700;
  color: #424242;
  margin: 0 0 8px 0;
  line-height: 1;
  letter-spacing: -2px;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.error-message {
  font-size: 15px;
  color: #666;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.actions {
  display: flex;
  justify-content: center;
}

.btn-home {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-home:hover {
  background-color: #43a047;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.btn-home:active {
  transform: translateY(0);
}

.btn-home svg {
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .error-container {
    padding: 32px 24px;
  }

  .error-code {
    font-size: 56px;
  }

  .error-title {
    font-size: 20px;
  }

  .error-icon svg {
    width: 80px;
    height: 80px;
  }
}
</style>
