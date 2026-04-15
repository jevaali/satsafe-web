import api from '../../api/client'

export abstract class BaseApiService<T> {
  constructor(private endpoint: string) {}

  async GetAll(): Promise<T[]> {
    try {
      const response = await api.get<T[]>(this.endpoint)
      return response.data
    } catch (error) {
      console.error('Error fetching data:', error)
      return []
    }
  }

  async GetById(id: number): Promise<T | null> {
    try {
      const response = await api.get<T>(`${this.endpoint}/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching data:', error)
      return null
    }
  }

  async Post(data: T): Promise<T | null> {
    try {
      const response = await api.post<T>(this.endpoint, data)
      return response.data
    } catch (error) {
      console.error('Error posting data:', error)
      return null
    }
  }

  async Put(id: number, data: T): Promise<T | null> {
    try {
      const response = await api.put<T>(`${this.endpoint}/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error putting data:', error)
      return null
    }
  }

  async Delete(id: number): Promise<boolean> {
    try {
      await api.delete(`${this.endpoint}/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting data:', error)
      return false
    }
  }
}
