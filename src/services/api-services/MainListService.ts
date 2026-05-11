import api from '../../api/client'
import type { IMainList } from '../../domain/IMainList'

export const MainListService = {
  async index(): Promise<IMainList> {
    const res = await api.get<IMainList>('MainList/Index')
    return res.data
  },
}
