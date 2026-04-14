import api from '../../api/client'
import type {
  ISatelliteListItem,
  ISatelliteDetail,
  IRiskAssessment,
  ICreateSatellitePayload,
  IUpdateSatellitePayload,
} from '../../domain/ISatellite'

const BASE = 'operator/Satellite'

export const SatelliteService = {
  async list(): Promise<ISatelliteListItem[]> {
    const res = await api.get<ISatelliteListItem[]>(`${BASE}/List`)
    return res.data
  },

  async details(id: string): Promise<ISatelliteDetail> {
    const res = await api.get<ISatelliteDetail>(`${BASE}/Details/${id}`)
    return res.data
  },

  async create(payload: ICreateSatellitePayload): Promise<ISatelliteDetail> {
    const res = await api.post<ISatelliteDetail>(`${BASE}/Create`, payload)
    return res.data
  },

  async update(id: string, payload: IUpdateSatellitePayload): Promise<ISatelliteDetail> {
    const res = await api.put<ISatelliteDetail>(`${BASE}/Update/${id}`, payload)
    return res.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/Delete/${id}`)
  },

  async generateRisk(id: string): Promise<IRiskAssessment> {
    const res = await api.post<IRiskAssessment>(`${BASE}/RegenerateRisk/${id}`)
    return res.data
  },
}
