import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ConjunctionService } from '../services/api-services/ConjunctionService'
import { EOperatorAcknowledgement } from '../domain/IConjunction'
import type { IConjunctionListItem, IConjunctionDetail } from '../domain/IConjunction'

export const useConjunctionStore = defineStore('conjunctions', () => {
  const conjunctions = ref<IConjunctionListItem[]>([])
  const selectedConjunction = ref<IConjunctionDetail | null>(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const acknowledgeLoading = ref(false)
  const error = ref<string | null>(null)

  const count = computed(() => conjunctions.value.length)
  const highRiskCount = computed(() => conjunctions.value.filter((c) => c.isHighRisk).length)

  const fetchList = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      conjunctions.value = await ConjunctionService.list()
    } catch (err: any) {
      error.value =
        err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to load conjunctions'
    } finally {
      loading.value = false
    }
  }

  const fetchDetails = async (id: string): Promise<void> => {
    detailLoading.value = true
    error.value = null
    try {
      selectedConjunction.value = await ConjunctionService.details(id)
    } catch (err: any) {
      error.value =
        err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to load conjunction'
    } finally {
      detailLoading.value = false
    }
  }

  const acknowledge = async (id: string): Promise<void> => {
    acknowledgeLoading.value = true
    try {
      await ConjunctionService.acknowledge(id)
      // Optimistically patch the detail — mark operator's side as acknowledged
      if (selectedConjunction.value?.id === id) {
        const side = selectedConjunction.value.operatorSide?.toLowerCase()
        if (side === 'primary') {
          selectedConjunction.value.primaryAcknowledgement = EOperatorAcknowledgement.Confirmed
        } else if (side === 'secondary') {
          selectedConjunction.value.secondaryAcknowledgement = EOperatorAcknowledgement.Confirmed
        }
      }
    } catch (err: any) {
      error.value =
        err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to acknowledge conjunction'
    } finally {
      acknowledgeLoading.value = false
    }
  }

  const clearSelection = (): void => {
    selectedConjunction.value = null
  }

  return {
    conjunctions,
    selectedConjunction,
    loading,
    detailLoading,
    acknowledgeLoading,
    error,
    count,
    highRiskCount,
    fetchList,
    fetchDetails,
    acknowledge,
    clearSelection,
  }
})
