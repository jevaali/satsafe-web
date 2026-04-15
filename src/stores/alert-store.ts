import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { AlertService } from '../services/api-services/AlertService'
import type { IAlertListItem, IAlertDetail } from '../domain/IAlert'

export const useAlertStore = defineStore('alerts', () => {
  const alerts = ref<IAlertListItem[]>([])
  const selectedAlert = ref<IAlertDetail | null>(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const actionLoading = ref(false)
  const error = ref<string | null>(null)

  const count = computed(() => alerts.value.length)
  const unacknowledgedCount = computed(() => alerts.value.filter((a) => !a.isAcknowledged).length)

  const fetchList = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      alerts.value = await AlertService.list()
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to load alerts'
    } finally {
      loading.value = false
    }
  }

  const fetchDetails = async (id: string): Promise<void> => {
    detailLoading.value = true
    error.value = null
    try {
      selectedAlert.value = await AlertService.details(id)
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to load alert'
    } finally {
      detailLoading.value = false
    }
  }

  const acknowledge = async (id: string): Promise<void> => {
    actionLoading.value = true
    try {
      await AlertService.acknowledge(id)
      // Update list item in place without a full refetch
      const item = alerts.value.find((a) => a.id === id)
      if (item) item.isAcknowledged = true
      if (selectedAlert.value?.id === id) selectedAlert.value.isAcknowledged = true
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to acknowledge alert'
    } finally {
      actionLoading.value = false
    }
  }

  const updateMessage = async (id: string, message: string): Promise<void> => {
    actionLoading.value = true
    try {
      await AlertService.updateMessage(id, message)
      // Patch the message field in-place so existing detail data (conjunctionEvent etc.) is preserved
      const item = alerts.value.find((a) => a.id === id)
      if (item) item.message = message
      if (selectedAlert.value?.id === id) selectedAlert.value.message = message
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to update message'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  const clearSelection = (): void => {
    selectedAlert.value = null
  }

  return {
    alerts,
    selectedAlert,
    loading,
    detailLoading,
    actionLoading,
    error,
    count,
    unacknowledgedCount,
    fetchList,
    fetchDetails,
    acknowledge,
    updateMessage,
    clearSelection,
  }
})
