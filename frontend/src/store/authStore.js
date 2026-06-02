import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL || '/api/v1'

// Axios instance
const api = axios.create({ baseURL: API, withCredentials: true })

// Interceptor: tự động refresh token khi 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true
      try {
        const { data } = await api.post('/auth/refresh')
        const newToken = data.data.access_token
        useAuthStore.getState().setToken(newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: true,

      setToken: (token) => {
        set({ token })
        api.defaults.headers.Authorization = `Bearer ${token}`
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ loading: false, isAuthenticated: false })
          return
        }
        try {
          api.defaults.headers.Authorization = `Bearer ${token}`
          const { data } = await api.get('/users/me')
          set({ user: data.data.user, isAuthenticated: true, loading: false })
        } catch {
          // Try refresh
          try {
            const { data } = await api.post('/auth/refresh')
            const newToken = data.data.access_token
            set({ token: newToken })
            api.defaults.headers.Authorization = `Bearer ${newToken}`
            const userRes = await api.get('/users/me')
            set({ user: userRes.data.data.user, isAuthenticated: true, loading: false })
          } catch {
            set({ user: null, token: null, isAuthenticated: false, loading: false })
          }
        }
      },

      register: async (username, email, password) => {
        const { data } = await api.post('/auth/register', { username, email, password })
        const { user, access_token } = data.data
        set({ user, token: access_token, isAuthenticated: true })
        api.defaults.headers.Authorization = `Bearer ${access_token}`
        toast.success('Đăng ký thành công! Chào mừng bạn 🐺')
        return data
      },

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        const { user, access_token } = data.data
        set({ user, token: access_token, isAuthenticated: true })
        api.defaults.headers.Authorization = `Bearer ${access_token}`
        toast.success(`Chào mừng trở lại, ${user.username}! 🐺`)
        return data
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch {}
        set({ user: null, token: null, isAuthenticated: false })
        api.defaults.headers.Authorization = ''
        toast('Đã đăng xuất', { icon: '👋' })
      },

      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates }
      })),
    }),
    {
      name: 'wolvesville-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
)

export { api }
