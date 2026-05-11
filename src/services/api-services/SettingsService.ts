import api from '../../api/client'
import type {
  ISettings,
  IUpdateOperatorSettingsPayload,
  IAddHelperPayload,
  ISaveNotificationsPayload,
} from '../../domain/ISettings'

const BASE = 'operator/Settings'

export const SettingsService = {
  async index(): Promise<ISettings> {
    const res = await api.get<ISettings>(`${BASE}/Index`)
    return res.data
  },

  async updateOperator(payload: IUpdateOperatorSettingsPayload): Promise<void> {
    await api.put(`${BASE}/UpdateOperator`, payload)
  },

  async addHelper(payload: IAddHelperPayload): Promise<void> {
    await api.post(`${BASE}/AddHelper`, payload)
  },

  async removeHelper(id: string): Promise<void> {
    await api.delete(`${BASE}/RemoveHelper/${id}`)
  },

  async saveNotifications(payload: ISaveNotificationsPayload): Promise<void> {
    await api.put(`${BASE}/SaveNotifications`, payload)
  },

  async actionLogs(filterUserId?: string) {
    const res = await api.get(`${BASE}/ActionLogs`, {
      params: filterUserId ? { filterUserId } : undefined,
    })
    return res.data
  },
}