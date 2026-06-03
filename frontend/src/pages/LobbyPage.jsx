import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore, api } from '../store/authStore'
import { useSocketStore } from '../store/socketStore'

// ROLES data for display
const ROLES_DISPLAY = [
  { slug: 'villager', vi: 'Dân Làng', icon: '🏘️', team: 'village', desc: 'Không có kỹ năng đặc biệt' },
  { slug: 'seer', vi: 'Tiên Tri', icon: '🔮', team: 'village', desc: 'Xem hào quang mỗi đêm' },
  { slug: 'doctor', vi: 'Bác Sĩ', icon: '💊', team: 'village', desc: 'Cứu sống 1 người mỗi đêm' },
  { slug: 'hunter', vi: 'Thợ Săn', icon: '🏹', team: 'village', desc: 'Bắn 1 người khi chết' },
  { slug: 'witch', vi: 'Phù Thủy', icon: '🧪', team: 'village', desc: '1 thuốc cứu + 1 thuốc độc' },
  { slug: 'bodyguard', vi: 'Vệ Sĩ', icon: '🛡️', team: 'village', desc: 'Bảo vệ, chết thay' },
  { slug: 'detective', vi: 'Thám Tử', icon: '🔍', team: 'village', desc: 'Theo dõi hành động đêm' },
  { slug: 'mayor', vi: 'Thị Trưởng', icon: '👑', team: 'village', desc: 'Phiếu bầu x2' },
  { slug: 'gunner', vi: 'Xạ Thủ', icon: '🔫', team: 'village', desc: '2 đạn bạc, bắn ban ngày' },
  { slug: 'jailer', vi: 'Cai Ngục', icon: '⛓️', team: 'village', desc: 'Giam người, có thể xử tử' },
  { slug: 'medium', vi: 'Ngoại Cảm', icon: '💀', team: 'village', desc: 'Chat với người chết' },
  { slug: 'werewolf', vi: 'Sói Thường', icon: '🐺', team: 'werewolf', desc: 'Giết 1 người mỗi đêm' },
  { slug: 'alpha_wolf', vi: 'Alpha Sói', icon: '🐺', team: 'werewolf', desc: 'Lãnh đạo đàn Sói' },
  { slug: 'wolf_seer', vi: 'Sói Tiên Tri', icon: '👁️', team: 'werewolf', desc: 'Sói + xem aura' },
  { slug: 'jester', vi: 'Kẻ Hề', icon: '🃏', team: 'solo', desc: 'Thắng khi bị treo cổ' },
  { slug: 'headhunter', vi: 'Săn Đầu Người', icon: '🎯', team: 'solo', desc: 'Thắng khi mục tiêu bị vote' },
  { slug: 'serial_killer', vi: 'Sát Nhân', icon: '🔪', team: 'solo', desc: 'Giết 1 người mỗi đêm' },
  { slug: 'arsonist', vi: 'Hỏa Tặc', icon: '🔥', team: 'solo', desc: 'Đổ dầu + đốt cháy' },
  { slug: 'cupid', vi: 'Thần Tình Yêu', icon: '💘', team: 'solo', desc: 'Nối 2 người yêu nhau' },
]

const teamColor = { village: '#26a69a', werewolf: '#e53935', solo: '#ffb300' }
const teamLabel = { village: 'Dân Làng', werewolf: 'Phe Sói', solo: 'Độc Lập' }

export default function LobbyPage() {
  const { user, logout, token } = useAuthStore()
  const { socket, connect, disconnect, connected, joinLobby, leaveLobby, startGame, addBot, removeBot, lobbyPlayers, roomCode, gameId, hostId } = useSocketStore()
  const [roomInput, setRoomInput] = useState('')
  const [view, setView] = useState('home') // home | room
  const [activeTab, setActiveTab] = useState('play') // play | roles | shop
  const [showBotConfirm, setShowBotConfirm] = useState(false)
  const [showRoleConfig, setShowRoleConfig] = useState(false)
  const [roleConfig, setRoleConfig] = useState({})
  const navigate = useNavigate()
  
  const isHost = hostId === user?.id

  function handleRoleClick(slug) {
    setRoleConfig(prev => {
      const current = prev[slug] || 0
      const total = Object.values(prev).reduce((a, b) => a + b, 0)
      if (total >= lobbyPlayers.length) return prev
      return { ...prev, [slug]: current + 1 }
    })
  }

  function handleRoleRemove(slug) {
    setRoleConfig(prev => {
      const current = prev[slug] || 0
      if (current <= 1) {
        const { [slug]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [slug]: current - 1 }
    })
  }

  useEffect(() => { if (token) connect(token) }, [token, connect])
  
  // Navigate to game ONLY when game:init fires (game actually started)
  useEffect(() => {
    if (!socket) return
    const handleGameInit = (data) => {
      console.log('🎮 Game init received, navigating to game:', data.gameId)
      navigate(`/game/${data.gameId}`)
    }
    socket.on('game:init', handleGameInit)
    return () => socket.off('game:init', handleGameInit)
  }, [socket, navigate])

  async function handleJoinRoom(e) {
    e.preventDefault()
    if (!roomInput || roomInput.length !== 6) return toast.error('Mã phòng gồm 6 ký tự')
    joinLobby(roomInput.toUpperCase())
    setView('room')
  }

  async function handleCreateRoom() {
    try {
      const { data } = await api.post('/games/rooms', { max_players: 12 })
      const code = data.data.game.room_code
      joinLobby(code)
      setView('room')
      toast.success(`Phòng ${code} đã tạo!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo phòng')
    }
  }

  function handleAddBot() {
    setShowBotConfirm(true)
  }

  function confirmAddBot() {
    addBot()
    setShowBotConfirm(false)
    toast.success('🤖 Đã thêm Bot!', { duration: 1500 })
  }

  const botCount = lobbyPlayers.filter(p => p.isBot).length
  const humanCount = lobbyPlayers.length - botCount

  if (view === 'room') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a0812 0%, #1a0e14 40%, #12101e 100%)' }} />
        <div className="absolute inset-0 bg-vn-hero" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => { leaveLobby(); setView('home') }} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <span className="text-lg">←</span>
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">Phòng {roomCode}</h2>
                <p className="text-gray-400 text-sm">{lobbyPlayers.length} người trong phòng {botCount > 0 && <span className="text-cyan-400">({botCount} bot)</span>}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">👥 Người Chơi ({lobbyPlayers.length}/12)</h3>
                <div className="space-y-3">
                  {lobbyPlayers.map((p, i) => (
                    <motion.div key={p.userId || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${p.isBot ? 'bg-cyan-900/30 border border-cyan-500/20' : 'bg-dark-700/50 border border-vn-gold-500/10'}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${p.isBot ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-vn-red-600 to-vn-gold-600'}`}>
                        {p.isBot ? '🤖' : p.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <span className={`font-medium ${p.isBot ? 'text-cyan-300' : 'text-white'}`}>{p.username}</span>
                        {p.isBot && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">BOT</span>}
                      </div>
                      {i === 0 && !p.isBot && <span className="text-xs badge-wolf">Host</span>}
                      {p.isBot && (
                        <button onClick={() => removeBot(p.userId)} className="w-7 h-7 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 text-xs transition-colors" title="Xóa bot">✕</button>
                      )}
                    </motion.div>
                  ))}
                  {lobbyPlayers.length === 0 && <div className="text-center text-gray-500 py-8">Chưa có ai trong phòng</div>}
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4">⚙️ Điều Khiển</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-700/40 rounded-xl text-center">
                    <p className="text-xs text-gray-400 mb-1">Mã phòng</p>
                    <p className="text-4xl font-mono font-black text-gradient tracking-[0.3em]">{roomCode}</p>
                    <p className="text-xs text-gray-500 mt-2">Chia sẻ mã này với bạn bè</p>
                  </div>

                  {/* ADD BOT BUTTON */}
                  <motion.button id="add-bot-btn" onClick={handleAddBot} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    disabled={lobbyPlayers.length >= 12}
                    className="w-full py-3 rounded-2xl font-bold text-sm transition-all border-2 border-dashed disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: '#06b6d4', color: '#06b6d4', background: 'rgba(6,182,212,0.08)' }}>
                    🤖 Tạo Bot {lobbyPlayers.length >= 12 ? '(Đầy)' : `(${botCount}/11)`}
                  </motion.button>

                  {/* BOT CONFIRM DIALOG */}
                  <AnimatePresence>
                    {showBotConfirm && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div className="p-4 bg-cyan-900/30 border border-cyan-500/30 rounded-xl">
                          <p className="text-sm text-cyan-200 mb-3">🤖 Thêm 1 bot AI vào phòng?</p>
                          <p className="text-xs text-gray-400 mb-3">Bot sẽ tự động chơi — chọn mục tiêu đêm, bỏ phiếu ban ngày theo logic thông minh.</p>
                          <div className="flex gap-2">
                            <button onClick={confirmAddBot} className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-bold transition-colors">✅ Xác nhận</button>
                            <button onClick={() => setShowBotConfirm(false)} className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-sm font-bold transition-colors">Hủy</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ROLE CONFIG */}
                  {isHost && (
                    <>
                      <motion.button onClick={() => setShowRoleConfig(!showRoleConfig)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="w-full py-3 rounded-2xl font-bold text-sm transition-all border-2 border-dashed border-purple-500/50 text-purple-300 bg-purple-500/10">
                        🎭 Cấu Hình Vai Trò Tùy Chọn
                      </motion.button>
                      
                      <AnimatePresence>
                        {showRoleConfig && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="bg-dark-800/80 p-4 rounded-xl border border-white/10 mt-2">
                              <div className="text-sm font-bold text-white mb-2 flex justify-between items-center">
                                <span>Chọn {lobbyPlayers.length} vai trò:</span>
                                <span className="text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">{Object.values(roleConfig).reduce((a,b)=>a+b,0)}/{lobbyPlayers.length}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                                {Object.keys(roleConfig).length === 0 && <span className="text-xs text-gray-500 italic">Sử dụng vai trò mặc định...</span>}
                                {Object.entries(roleConfig).map(([slug, count]) => {
                                  const role = ROLES_DISPLAY.find(r => r.slug === slug)
                                  if (!role) return null
                                  return (
                                    <div key={slug} onClick={() => handleRoleRemove(slug)} className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded cursor-pointer hover:bg-red-500/30 transition-colors">
                                      <span>{role.icon}</span>
                                      <span className="text-xs font-bold text-white">{role.vi} x{count}</span>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 gap-1 max-h-40 overflow-y-auto pr-1">
                                {ROLES_DISPLAY.map(role => (
                                  <div key={role.slug} onClick={() => handleRoleClick(role.slug)} title={role.vi} className="flex flex-col items-center justify-center bg-white/5 p-2 rounded hover:bg-white/10 cursor-pointer text-2xl transition-transform hover:scale-110">
                                    {role.icon}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  <motion.button 
                    id="start-game-btn" 
                    onClick={() => startGame(showRoleConfig ? roleConfig : {})} 
                    whileTap={{ scale: 0.97 }} 
                    disabled={lobbyPlayers.length < 4 || (showRoleConfig && Object.values(roleConfig).reduce((a,b)=>a+b,0) !== lobbyPlayers.length)}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5"
                    style={{ background: 'linear-gradient(135deg, #c62828, #e53935, #ff6f00)', color: 'white', boxShadow: '0 4px 20px rgba(229,57,53,0.35)' }}>
                    <span>▶ Bắt Đầu Game</span>
                    {lobbyPlayers.length < 4 ? (
                      <span className="text-xs opacity-70">(cần {4 - lobbyPlayers.length} người nữa)</span>
                    ) : showRoleConfig && Object.values(roleConfig).reduce((a,b)=>a+b,0) !== lobbyPlayers.length ? (
                      <span className="text-xs opacity-90 font-medium">(Hãy chọn đúng {lobbyPlayers.length} vai trò)</span>
                    ) : null}
                  </motion.button>
                  <button onClick={() => { leaveLobby(); setView('home') }} className="btn-ghost w-full text-sm">Rời Phòng</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }



  // ============================================================
  // MAIN DASHBOARD (HOME VIEW) — Inspired by Wolvesville
  // ============================================================
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Vietnamese Night Sky Background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #0a0812 0%, #1a0e14 35%, #12101e 65%, #0a0812 100%)',
      }} />
      {/* Mountain/tree silhouettes */}
      {/* Vietnamese warm glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 rounded-full blur-3xl" style={{
        background: 'radial-gradient(ellipse, rgba(229,57,53,0.12) 0%, rgba(255,179,0,0.06) 50%, transparent 80%)'
      }} />
      <div className="absolute bottom-0 left-0 right-0 h-40 opacity-30" style={{
        background: 'linear-gradient(to top, #0a0812, transparent)',
      }} />
      <div className="absolute bottom-0 left-0 w-40 h-56 opacity-15" style={{
        background: 'radial-gradient(ellipse at bottom left, #004d40 0%, transparent 70%)'
      }} />
      <div className="absolute bottom-0 right-0 w-40 h-56 opacity-15" style={{
        background: 'radial-gradient(ellipse at bottom right, #004d40 0%, transparent 70%)'
      }} />
      {/* Stars */}
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white animate-pulse-slow" style={{
          width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
          top: `${Math.random() * 50}%`, left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`, opacity: Math.random() * 0.6 + 0.2,
        }} />
      ))}

      {/* TOP BAR — Wolvesville style */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3">
        <div />
        <div className="flex items-center gap-2">
          {/* Currency */}
          <div className="flex items-center gap-4 bg-dark-800/70 backdrop-blur-sm rounded-full px-5 py-2" style={{ border: '1px solid rgba(255,179,0,0.12)' }}>
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400 text-sm">🪙</span>
              <span className="font-bold text-sm text-white">{user?.coins?.toLocaleString() || 500}</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🌹</span>
              <span className="font-bold text-sm text-white">{user?.roses || 0}</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <span className="text-pink-400 text-sm">💎</span>
              <span className="font-bold text-sm text-white">{user?.gems || 0}</span>
            </div>
          </div>
          {/* Action buttons */}
          <button className="w-9 h-9 rounded-full bg-dark-800/70 border border-white/10 flex items-center justify-center text-sm hover:bg-dark-700 transition-colors">🔔</button>
          <button onClick={() => navigate(`/profile/${user?.username}`)} className="w-9 h-9 rounded-full bg-dark-800/70 border border-white/10 flex items-center justify-center text-sm hover:bg-dark-700 transition-colors">👤</button>
          <button onClick={() => { disconnect(); logout(); navigate('/login') }} className="w-9 h-9 rounded-full bg-dark-800/70 border border-white/10 flex items-center justify-center text-sm hover:bg-dark-700 transition-colors text-gray-400 hover:text-red-400">⏻</button>
        </div>
      </header>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
        {/* LEFT SIDEBAR — Navigation */}
        <aside className="w-full lg:w-64 p-4 flex flex-col gap-3 shrink-0">
          {/* Logo */}
          <div className="mb-4">
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit', color: '#fff' }}>
              Ma Sói<span className="text-vn-gold-400 ml-1">🐾</span><span className="text-vn-red-400">VN</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
              <span className="text-[11px] text-gray-400">{connected ? 'Đã kết nối' : 'Đang kết nối...'}</span>
            </div>
          </div>

          {/* Nav Buttons */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleCreateRoom}
            className="py-4 rounded-2xl font-black text-lg text-white tracking-wider transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #c62828, #e53935, #ff6f00)', boxShadow: '0 4px 20px rgba(229,57,53,0.4)' }}>
            CHƠI
          </motion.button>

          {[
            { key: 'roles', label: 'VAI TRÒ', icon: '🎭' },
            { key: 'join', label: 'VÀO PHÒNG', icon: '🚪' },
          ].map(item => (
            <motion.button key={item.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => item.key === 'join' ? null : setActiveTab(item.key)}
              className={`py-3 px-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.key ? 'bg-vn-gold-400 text-dark-900 shadow-md shadow-vn-gold-500/20' : 'bg-white/90 text-dark-800 hover:bg-vn-gold-100'}`}>
              {item.icon} {item.label}
            </motion.button>
          ))}

          {/* Join Room Input */}
          <form onSubmit={handleJoinRoom} className="mt-1">
            <div className="flex gap-2">
              <input value={roomInput} onChange={e => setRoomInput(e.target.value.toUpperCase())}
                className="flex-1 bg-white/90 text-dark-800 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-400 font-bold"
                placeholder="MÃ PHÒNG" maxLength={6} />
              <button type="submit" className="px-4 py-2.5 bg-white rounded-xl text-dark-800 font-bold text-sm hover:bg-gray-100 transition-colors">→</button>
            </div>
          </form>

          {/* Stats at bottom */}
          <div className="mt-auto space-y-2">
            {[
              { label: 'Ván chơi', value: user?.games_played || 0, icon: '🎮' },
              { label: 'Thắng', value: user?.games_won || 0, icon: '🏆' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs text-gray-300">{s.label}</span>
                <span className="ml-auto font-bold text-sm text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER — Avatar/Welcome area */}
        <main className="flex-1 flex items-center justify-center min-h-[40vh] lg:min-h-0 order-first lg:order-none p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'play' && (
              <motion.div key="play" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center">
                <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4 }}
                  className="mb-6 flex justify-center">
                  <img src="/modern-wolf-logo.png" className="w-40 h-40 object-cover rounded-3xl drop-shadow-[0_0_25px_rgba(229,57,53,0.5)] border-2 border-vn-gold-500/30" alt="Ma Sói VN Logo" />
                </motion.div>
                <h2 className="text-4xl font-black text-gradient mb-3" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                  Ma Sói Việt Nam
                </h2>
                <p className="text-vn-gold-400/60 text-lg max-w-md mx-auto mb-2 tracking-wider">
                  ⟡ Chơi cùng bạn bè • 19 vai trò • Chiến đấu trí tuệ ⟡
                </p>
                <p className="text-vn-jade-400/50 text-sm mb-6">🇻🇳 Phiên bản Việt Nam</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleCreateRoom}
                  className="py-4 px-10 rounded-2xl font-black text-xl text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #c62828, #e53935, #ff6f00)', boxShadow: '0 6px 30px rgba(229,57,53,0.45)' }}>
                  🏮 Tạo Phòng Mới
                </motion.button>
              </motion.div>
            )}

            {activeTab === 'roles' && (
              <motion.div key="roles" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="w-full max-w-3xl mx-auto px-4">
                <div className="bg-white/95 rounded-3xl p-6 shadow-2xl max-h-[75vh] overflow-y-auto relative">
                  <button onClick={() => setActiveTab('play')} className="absolute top-6 left-6 flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
                    <span>←</span> Quay lại
                  </button>
                  <h2 className="text-xl font-black text-gray-800 mb-4 text-center">Vai Trò</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {ROLES_DISPLAY.map(role => (
                      <motion.div key={role.slug} whileHover={{ y: -4, scale: 1.05 }}
                        className="flex flex-col items-center gap-2 p-3 rounded-2xl cursor-default transition-all hover:shadow-lg group relative"
                        style={{ background: `${teamColor[role.team]}10`, border: `2px solid ${teamColor[role.team]}30` }}>
                        <div className="text-3xl">{role.icon}</div>
                        <div className="text-xs font-bold text-gray-800 text-center">{role.vi}</div>
                        <div className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: teamColor[role.team] + '20', color: teamColor[role.team] }}>
                          {teamLabel[role.team]}
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-[10px] p-2 rounded-lg z-50 text-center pointer-events-none shadow-xl">
                          {role.desc}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* RIGHT SIDEBAR — User Stats & Quests */}
        <aside className="w-full lg:w-72 p-4 space-y-3 shrink-0">
          {/* User Card */}
          <div className="rounded-2xl p-4 shadow-lg relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.93)', border: '1px solid rgba(255,179,0,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vn-red-600 to-vn-gold-500 flex items-center justify-center font-bold text-white" style={{ boxShadow: '0 0 10px rgba(255,179,0,0.3)' }}>
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">{user?.username || 'Player'}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-vn-red-500 to-vn-gold-500 rounded-full transition-all" style={{ width: `${Math.min(((user?.xp || 0) / (user?.xp_next_level || 1000)) * 100, 100)}%` }} />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-vn-gold-400 to-vn-gold-600 flex items-center justify-center" style={{ boxShadow: '0 0 8px rgba(255,179,0,0.3)' }}>
                    <span className="text-[10px] font-black text-white">{user?.level || 1}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-dark-800/60 backdrop-blur-sm rounded-2xl p-4 space-y-3" style={{ border: '1px solid rgba(255,179,0,0.1)' }}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thống Kê</h3>
            {[
              { label: 'Tổng ván', value: user?.games_played || 0, color: '#26a69a' },
              { label: 'Ván thắng', value: user?.games_won || 0, color: '#e53935' },
              { label: 'Tỷ lệ thắng', value: user?.games_played > 0 ? `${Math.round((user.games_won / user.games_played) * 100)}%` : '—', color: '#ffb300' },
              { label: 'ELO', value: user?.stats?.elo_rating || 1000, color: '#b085ff' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{stat.label}</span>
                <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Challenge Card */}
          <div className="bg-dark-800/60 backdrop-blur-sm rounded-2xl p-4" style={{ border: '1px solid rgba(255,179,0,0.1)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thử Thách</h3>
              <span className="text-[10px] text-gray-500">Hàng ngày</span>
            </div>
            {[
              { task: 'Chơi 1 ván game', progress: 0, max: 1, reward: '🪙 50', icon: '🎮' },
              { task: 'Thắng 1 ván', progress: 0, max: 1, reward: '🪙 100', icon: '🏆' },
              { task: 'Dùng Tiên Tri', progress: 0, max: 1, reward: '💎 5', icon: '🔮' },
            ].map((q, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{q.icon}</span>
                  <span className="text-xs text-gray-300 flex-1">{q.task}</span>
                  <span className="text-[10px] text-yellow-400">{q.reward}</span>
                </div>
                <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden" style={{ border: '1px solid rgba(255,179,0,0.05)' }}>
                  <div className="h-full bg-gradient-to-r from-vn-red-500 to-vn-gold-500 rounded-full transition-all" style={{ width: `${(q.progress / q.max) * 100}%` }} />
                </div>
                <div className="text-right text-[10px] text-gray-500 mt-0.5">{q.progress}/{q.max}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
