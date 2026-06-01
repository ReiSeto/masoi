import { create } from 'zustand'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

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
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      set({ connected: true })
      console.log('🔌 Socket connected')
    })

    socket.on('disconnect', (reason) => {
      set({ connected: false })
      console.log('🔌 Socket disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message)
    })

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
