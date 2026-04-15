import { api } from './axios'
import { AxiosInterceptor } from './axios-interceptor'
import { useAuthStore } from '../stores/auth-store'

const interceptor = new AxiosInterceptor(api)

// Lazy initialization to prevent Pinia initialization order issues
let authStore: ReturnType<typeof useAuthStore> | null = null
const getAuthStore = () => {
  if (!authStore) {
    authStore = useAuthStore()
  }
  return authStore
}

interceptor.setup(
  () => getAuthStore().getAccessToken(),
  () => getAuthStore().logout(),
  () => getAuthStore().refreshToken(),
)

export default api
