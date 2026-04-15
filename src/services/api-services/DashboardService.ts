import api from '../../api/client'
import type { IDashboard } from '../../domain/IDashboard'

export const DashboardService = {
  async get(): Promise<IDashboard> {
    const res = await api.get<IDashboard>('operator/Dashboard/GetDashboard')
    return res.data
  },
}
