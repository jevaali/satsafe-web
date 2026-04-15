import type { AxiosInstance, AxiosError } from 'axios'

export class AxiosInterceptor {
  private isRefreshing = false
  private queue: Array<() => void> = []

  constructor(private api: AxiosInstance) {}

  setup(getAccessToken: () => string | null, onLogout: () => void, onRefresh: () => Promise<void>) {
    // REQUEST
    this.api.interceptors.request.use((config) => {
      const token = getAccessToken()

      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)
      }

      return config
    })

    // RESPONSE
    this.api.interceptors.response.use(
      (res) => res,
      async (error: AxiosError) => {
        const config = error.config as any

        if (!config || error.response?.status !== 401) {
          return Promise.reject(error)
        }

        // if refresh already running → wait
        if (this.isRefreshing) {
          return new Promise((resolve) => {
            this.queue.push(() => {
              const newToken = getAccessToken()
              if (newToken) {
                config?.headers.set('Authorization', `Bearer ${newToken}`)
              }
              resolve(this.api(config))
            })
          })
        }

        this.isRefreshing = true

        try {
          await onRefresh()

          // Update config with new token before retrying
          const newToken = getAccessToken()
          if (config && newToken) {
            config.headers.set('Authorization', `Bearer ${newToken}`)
          }

          // Process queued requests
          this.queue.forEach((cb) => cb())
          this.queue = []

          return this.api(config)
        } catch (err) {
          this.queue = []
          onLogout()
          return Promise.reject(err)
        } finally {
          this.isRefreshing = false
        }
      },
    )
  }
}
