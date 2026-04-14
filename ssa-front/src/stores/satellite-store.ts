import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { SatelliteService } from '../services/api-services/SatelliteService'
import type {
  ISatelliteListItem,
  ISatelliteDetail,
  ICreateSatellitePayload,
  IUpdateSatellitePayload,
} from '../domain/ISatellite'

export const useSatelliteStore = defineStore('satellites', () => {
  const satellites = ref<ISatelliteListItem[]>([])
  const selectedSatellite = ref<ISatelliteDetail | null>(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const riskLoading = ref(false)
  const error = ref<string | null>(null)

  const count = computed(() => satellites.value.length)

  const fetchList = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      satellites.value = await SatelliteService.list()
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to load satellites'
    } finally {
      loading.value = false
    }
  }

  const fetchDetails = async (id: string): Promise<void> => {
    detailLoading.value = true
    error.value = null
    try {
      selectedSatellite.value = await SatelliteService.details(id)
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to load satellite'
    } finally {
      detailLoading.value = false
    }
  }

  const create = async (payload: ICreateSatellitePayload): Promise<ISatelliteDetail> => {
    const result = await SatelliteService.create(payload)
    await fetchList()
    return result
  }

  const update = async (id: string, payload: IUpdateSatellitePayload): Promise<ISatelliteDetail> => {
    const result = await SatelliteService.update(id, payload)
    await fetchList()
    if (selectedSatellite.value?.id === id) {
      await fetchDetails(id)
    }
    return result
  }

  const remove = async (id: string): Promise<void> => {
    await SatelliteService.delete(id)
    satellites.value = satellites.value.filter((s) => s.id !== id)
    if (selectedSatellite.value?.id === id) {
      selectedSatellite.value = null
    }
  }

  const generateRisk = async (id: string): Promise<void> => {
    riskLoading.value = true
    try {
      await SatelliteService.generateRisk(id)
      // Refresh list and open detail if currently viewed
      await fetchList()
      if (selectedSatellite.value?.id === id) {
        await fetchDetails(id)
      }
    } finally {
      riskLoading.value = false
    }
  }

  const clearSelection = (): void => {
    selectedSatellite.value = null
  }

  return {
    satellites,
    selectedSatellite,
    loading,
    detailLoading,
    riskLoading,
    error,
    count,
    fetchList,
    fetchDetails,
    create,
    update,
    remove,
    generateRisk,
    clearSelection,
  }
})
