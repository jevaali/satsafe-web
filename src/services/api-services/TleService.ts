import api from '../../api/client'
import type { IAddTlePayload } from '../../domain/ISatellite'

const BASE = 'operator/Tle'

export const TleService = {
  async addManually(id: string, payload: IAddTlePayload): Promise<void> {
    await api.post(`${BASE}/AddTleManually/${id}`, payload)
  },
}
