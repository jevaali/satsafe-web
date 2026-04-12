import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '../api/client'
import type { IUser } from '../domain/IUser'

export const useAuthStore = defineStore('auth', () => {
  // STATE
  const accessToken = ref<string>('')
  const user = ref<IUser | null>(null)

  // SET TOKEN
  const setAccessToken = (token: string): boolean => {
    if (!token || token.trim() === '') {
      return false
    }

    accessToken.value = token
    localStorage.setItem('access_token', token)

    return true
  }

  const setRefreshToken = (token: string): void => {
    if (!token || token.trim() === '') {
      return
    }
    localStorage.setItem('refresh_token', token)
  }

  const getRefreshToken = (): string | null => {
    return localStorage.getItem('refresh_token')
  }

  const getAccessToken = (): string | null => {
    if (!accessToken.value) {
      const stored = localStorage.getItem('access_token')
      if (stored) {
        accessToken.value = stored
      }
    }

    return accessToken.value
  }

  // REGISTER
  const register = async (
    email: string,
    password: string,
    firstname: string,
    lastname: string,
    operatorName: string,
    operatorCountry: string,
    operatorType: number,
  ) => {
    try {
      const res = await api.post<{ jwt: string; refreshToken: string }>('identity/Account/Register', {
        email,
        password,
        firstname,
        lastname,
        registerAsOperator: true,
        operatorName,
        operatorCountry,
        operatorType,
      })

      if (!res.data?.jwt) {
        throw new Error('Invalid register response')
      }

      setAccessToken(res.data.jwt)
      setRefreshToken(res.data.refreshToken)

      user.value = {
        email,
        firstName: firstname,
        lastName: lastname,
        operatorName,
        operatorCountry,
        operatorType,
      }
    } catch (err: any) {
      console.error('Register failed', err)

      if (err.response?.data?.messages && Array.isArray(err.response.data.messages)) {
        throw new Error(err.response.data.messages[0])
      }

      throw err
    }
  }

  // LOGIN
  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<{ jwt: string; refreshToken: string }>('identity/Account/Login', {
        email,
        password,
      })

      if (!res.data?.jwt) {
        console.error('Invalid login response: missing jwt')
        throw new Error('Invalid login response')
      }

      setAccessToken(res.data.jwt)
      setRefreshToken(res.data.refreshToken)

      user.value = {
        email,
        firstName: '',
        lastName: '',
      }
    } catch (err: any) {
      console.error('Login failed', err)

      if (err.response?.data?.messages && Array.isArray(err.response.data.messages)) {
        throw new Error(err.response.data.messages[0])
      }

      throw err
    }
  }

  // REFRESH TOKEN
  const refreshToken = async () => {
    const currentRefreshToken = getRefreshToken()
    const currentAccessToken = getAccessToken()

    if (!currentRefreshToken) {
      logout()
      throw new Error('No refresh token available')
    }

    try {
      //const res = await api.post('identity/Account/RefreshToken?expiresInSeconds=10',
      const res = await api.post('/Account/RefreshToken', {
        jwt: currentAccessToken,
        refreshToken: currentRefreshToken,
      })

      // Check for different possible response formats
      const newAccessToken = res.data?.jwt || res.data?.token || res.data?.accessToken
      const newRefreshToken = res.data?.refreshToken

      if (!newAccessToken) {
        throw new Error('Invalid refresh response')
      }

      setAccessToken(newAccessToken)
      setRefreshToken(newRefreshToken)
    } catch (err) {
      logout()
      throw err
    }
  }

  // LOGOUT
  const logout = () => {
    accessToken.value = ''
    user.value = null

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  // IS AUTHENTICATED
  const isAuthenticated = computed(() => {
    return getAccessToken() !== null && getAccessToken() !== ''
  })

  return {
    accessToken,
    user,
    register,
    login,
    logout,
    refreshToken,
    getAccessToken,
    setAccessToken,
    getRefreshToken,
    isAuthenticated,
  }
})
