import { create } from 'zustand'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  gameId: null,
  roomCode: null,
  lobbyPlayers: [],
  messages: [],
  chatChannel: 'public',
  lastGameInit: null, // Cache for game:init data

  // Kết nối socket với token
  connect: (token) => {
    const existing = get().socket
    // If already connected with same token, skip
    if (existing?.connected && existing?.auth?.token === token) return
    // Disconnect stale socket before reconnecting with new token
    if (existing) {
      existing.disconnect()
      set({ socket: null, connected: false })
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socket.on('connect', () => {
      set({ connected: true })
      console.log('🔌 Socket connected')
    })

    socket.on('disconnect', (reason) => {
      set({ connected: false })
      console.log('🔌 Socket disconnected:', reason)
    })

    // Token refresh on connect error — prevents mid-game kicks
    socket.on('connect_error', async (err) => {
      console.error('Socket connect_error:', err.message)
      if (err.message?.includes('Token') || err.message?.includes('token') || err.message?.includes('hết hạn')) {
        console.log('🔄 Token expired — attempting refresh before reconnect...')
        try {
          const { useAuthStore } = await import('./authStore')
          const authStore = useAuthStore.getState()
          // Refresh token via HTTP (uses cookie-based refresh_token)
          const API = import.meta.env.VITE_API_URL || '/api/v1'
          const res = await fetch(`${API}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (res.ok) {
            const data = await res.json()
            const newToken = data.data?.access_token
            if (newToken) {
              authStore.setToken(newToken)
              // Update socket auth with new token for next reconnect attempt
              socket.auth = { token: newToken }
              console.log('✅ Token refreshed — socket will reconnect with new token')
              // Socket.IO will auto-retry with the updated auth
            }
          } else {
            console.error('❌ Token refresh failed — user may need to re-login')
          }
        } catch (refreshErr) {
          console.error('❌ Token refresh error:', refreshErr.message)
        }
      }
    })

    // Periodic token refresh every 10 minutes to prevent expiry during long games
    const tokenRefreshInterval = setInterval(async () => {
      if (!socket.connected) return
      try {
        const API = import.meta.env.VITE_API_URL || '/api/v1'
        const res = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
        if (res.ok) {
          const data = await res.json()
          const newToken = data.data?.access_token
          if (newToken) {
            const { useAuthStore } = await import('./authStore')
            useAuthStore.getState().setToken(newToken)
            socket.auth = { token: newToken }
            console.log('🔄 Token proactively refreshed (every 10m)')
          }
        }
      } catch {}
    }, 10 * 60 * 1000) // Every 10 minutes

    socket._tokenRefreshInterval = tokenRefreshInterval

    // Lobby events
    socket.on('lobby:joined', ({ game_id, room_code, host_id }) => {
      set({ gameId: game_id, roomCode: room_code, hostId: host_id, messages: [] })
    })

    socket.on('lobby:updated', ({ players, host_id }) => {
      set({ lobbyPlayers: players, hostId: host_id })
    })

    socket.on('lobby:player_joined', ({ player }) => {
      toast(`${player.username} đã vào phòng 🎮`)
    })

    socket.on('lobby:player_left', ({ player_id }) => {
      set((state) => ({
        lobbyPlayers: state.lobbyPlayers.filter((p) => p.userId !== player_id)
      }))
    })

    socket.on('lobby:countdown', ({ seconds }) => {
      toast(`Trò chơi bắt đầu sau ${seconds} giây...`, { icon: '⏱️', duration: 3000 })
    })

    socket.on('game:started', ({ game_id }) => {
      toast.success('Trò chơi bắt đầu!', { icon: '🐺' })
      set({ gameId: game_id })
    })

    socket.on('game:init', (data) => {
      // Cache game:init data for GamePage to pick up on mount
      set({ lastGameInit: data, messages: [] })
    })

    // Chat events
    socket.on('chat:message', (message) => {
      set((state) => ({
        messages: [...state.messages.slice(-200), message] // Giữ tối đa 200 tin nhắn
      }))
    })

    // Error events
    socket.on('error', ({ message, code }) => {
      toast.error(message)
    })

    set({ socket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      if (socket._tokenRefreshInterval) clearInterval(socket._tokenRefreshInterval)
      socket.disconnect()
      set({ socket: null, connected: false, gameId: null, roomCode: null, lobbyPlayers: [], messages: [] })
    }
  },

  // Emit events
  joinLobby: (room_code) => {
    get().socket?.emit('lobby:join', { room_code })
  },

  leaveLobby: () => {
    get().socket?.emit('lobby:leave')
    set({ gameId: null, roomCode: null, lobbyPlayers: [], messages: [] })
  },

  startGame: (roleConfig) => {
    get().socket?.emit('lobby:start', { roleConfig })
  },

  sendMessage: (content, channel = 'public') => {
    get().socket?.emit('chat:send', { content, channel })
  },

  nightAction: (action_type, target_id) => {
    get().socket?.emit('game:night_action', { action_type, target_id })
  },

  vote: (target_id) => {
    get().socket?.emit('game:vote', { target_id })
  },

  addBot: () => {
    get().socket?.emit('lobby:add_bot')
  },

  removeBot: (botId) => {
    get().socket?.emit('lobby:remove_bot', { botId })
  },

  setChatChannel: (channel) => set({ chatChannel: channel }),
  clearMessages: () => set({ messages: [] }),
  clearGameInit: () => set({ lastGameInit: null }),

  mayorReveal: () => {
    get().socket?.emit('game:mayor_reveal')
  },
}))
