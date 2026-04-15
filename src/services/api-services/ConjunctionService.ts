import api from '../../api/client'
import type { IConjunctionListItem, IConjunctionDetail } from '../../domain/IConjunction'

const BASE = 'operator/Conjunctions'

export const ConjunctionService = {
  async list(): Promise<IConjunctionListItem[]> {
    const res = await api.get<IConjunctionListItem[]>(`${BASE}/List`)
    return res.data
  },

  async details(id: string): Promise<IConjunctionDetail> {
    const res = await api.get<IConjunctionDetail>(`${BASE}/Details/${id}`)
    return res.data
  },

  async acknowledge(id: string): Promise<void> {
    await api.post(`${BASE}/Acknowledge/${id}`)
  },
}
