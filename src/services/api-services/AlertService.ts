import api from '../../api/client'
import type { IAlertListItem, IAlertDetail } from '../../domain/IAlert'

const BASE = 'operator/Alerts'

export const AlertService = {
  async list(): Promise<IAlertListItem[]> {
    const res = await api.get<IAlertListItem[]>(`${BASE}/List`)
    return res.data
  },

  async details(id: string): Promise<IAlertDetail> {
    const res = await api.get<IAlertDetail>(`${BASE}/Details/${id}`)
    return res.data
  },

  async acknowledge(id: string): Promise<void> {
    await api.post(`${BASE}/Acknowledge/${id}`)
  },

  async updateMessage(id: string, message: string): Promise<IAlertDetail> {
    const res = await api.put<IAlertDetail>(`${BASE}/UpdateMessage/${id}`, JSON.stringify(message), {
      headers: { 'Content-Type': 'application/json' },
    })
    return res.data
  },
}
