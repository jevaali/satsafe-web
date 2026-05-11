import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { SettingsService } from '../services/api-services/SettingsService'
import type {
  ISettings,
  IHelper,
  IUpdateOperatorSettingsPayload,
  IAddHelperPayload,
  ISaveNotificationsPayload,
} from '../domain/ISettings'
import type { IOperatorActionLog } from '../domain/ISettings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<ISettings | null>(null)
  const actionLogs = ref<IOperatorActionLog[]>([])
  const loading = ref(false)
  const actionLoading = ref(false)
  const error = ref<string | null>(null)

  const operator = computed(() => settings.value?.operator ?? null)
  const helpers = computed(() => settings.value?.helpers ?? [])
  const satellites = computed(() => settings.value?.satellites ?? [])
  const notificationSetting = computed(() => settings.value?.notificationSetting ?? null)

  const fetchSettings = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      settings.value = await SettingsService.index()
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to load settings'
    } finally {
      loading.value = false
    }
  }

  const updateOperator = async (payload: IUpdateOperatorSettingsPayload): Promise<void> => {
    actionLoading.value = true
    error.value = null
    try {
      await SettingsService.updateOperator(payload)
      if (settings.value) {
        settings.value.operator.name = payload.name
        settings.value.operator.countryCode = payload.country
        settings.value.operator.operatorType = payload.operatorType
      }
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to update operator'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  const addHelper = async (payload: IAddHelperPayload): Promise<void> => {
    actionLoading.value = true
    error.value = null
    try {
      await SettingsService.addHelper(payload)
      await fetchSettings() // refetch since server assigns the id
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to add helper'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  const removeHelper = async (id: string): Promise<void> => {
    actionLoading.value = true
    error.value = null
    try {
      await SettingsService.removeHelper(id)
      if (settings.value) {
        settings.value.helpers = settings.value.helpers.filter((h) => h.id !== id)
      }
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to remove helper'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  const saveNotifications = async (payload: ISaveNotificationsPayload): Promise<void> => {
    actionLoading.value = true
    error.value = null
    try {
      await SettingsService.saveNotifications(payload)
      if (settings.value) {
        settings.value.notificationSetting = { ...payload }
      }
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to save notifications'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  const fetchActionLogs = async (filterUserId?: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      actionLogs.value = await SettingsService.actionLogs(filterUserId)
    } catch (err: any) {
      error.value = err?.response?.data?.messages?.[0] ?? err?.message ?? 'Failed to load action logs'
    } finally {
      loading.value = false
    }
  }

  return {
    settings,
    actionLogs,
    loading,
    actionLoading,
    error,
    operator,
    helpers,
    satellites,
    notificationSetting,
    fetchSettings,
    updateOperator,
    addHelper,
    removeHelper,
    saveNotifications,
    fetchActionLogs,
  }
})