import { ref } from 'vue'
import { defineStore } from 'pinia'
import { DashboardService } from '../services/api-services/DashboardService'
import type { IDashboard } from '../domain/IDashboard'

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<IDashboard | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetch = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      data.value = await DashboardService.get()
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to load dashboard'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetch }
})
