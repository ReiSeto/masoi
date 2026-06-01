import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocketStore } from '../store/socketStore'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// Helper function to hash usernames for consistent avatar generation
function getHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

// Helper to shuffle avatars deterministically based on seed
function getShuffledAvatars(seedStr) {
  let seed = getHash(seedStr || 'default')
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  for (let i = arr.length - 1; i > 0; i--) {
    const randomVal = Math.abs(Math.sin(seed++) * 10000)
    const j = Math.floor(randomVal) % (i + 1)
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}

// Combined role details, teams, descriptions and auras
const ROLE_DETAILS = {
  villager: { vi: 'Dân Làng', icon: '🏘️', color: '#10b981', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Không có kỹ năng đặc biệt ban đêm. Sử dụng lập luận, đối thoại và phiếu bầu ban ngày để tìm ra và treo cổ bầy Sói bảo vệ ngôi làng.' },
  seer: { vi: 'Tiên Tri', icon: '🔮', color: '#8b5cf6', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Mỗi đêm, bạn có thể chọn soi một người chơi để biết hào quang của họ là Thiện (Good) hay Ác (Evil), giúp xác định ai là Sói.' },
  doctor: { vi: 'Bác Sĩ', icon: '💊', color: '#06b6d4', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Mỗi đêm, bạn có thể chọn cứu một người chơi khỏi cái chết. Bạn có thể tự cứu mình nhưng không được cứu một người liên tiếp hai đêm.' },
  hunter: { vi: 'Thợ Săn', icon: '🏹', color: '#f59e0b', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Nếu bạn bị giết bởi Sói hoặc bị treo cổ ban ngày, bạn sẽ lập tức kích hoạt phát bắn cuối cùng để hạ gục một người chơi khác theo ý muốn.' },
  witch: { vi: 'Phù Thủy', icon: '🧪', color: '#a855f7', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Sở hữu 2 bình thuốc ma thuật dùng một lần: một bình sinh mệnh cứu sống nạn nhân bị Sói cắn đêm đó, một bình độc dược tiêu diệt một người.' },
  bodyguard: { vi: 'Vệ Sĩ', icon: '🛡️', color: '#3b82f6', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Mỗi đêm chọn một người để bảo vệ. Nếu mục tiêu bị tấn công, bạn sẽ chết thay cho họ. Bạn không thể bảo vệ cùng một người hai đêm liên tiếp.' },
  detective: { vi: 'Thám Tử', icon: '🔍', color: '#14b8a6', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Mỗi đêm, chọn một người chơi để theo dõi. Bạn sẽ nhận được thông tin người đó có đi ra ngoài ghé thăm ai khác trong đêm đó hay không.' },
  mayor: { vi: 'Thị Trưởng', icon: '👑', color: '#eab308', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Một khi bạn tiết lộ danh tính của mình ban ngày, lá phiếu biểu quyết treo cổ của bạn sẽ có trọng số gấp đôi (tính bằng 2 phiếu).' },
  gunner: { vi: 'Xạ Thủ', icon: '🔫', color: '#eab308', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Sở hữu 2 viên đạn bạc. Có thể bắn công khai ban ngày để tiêu diệt mục tiêu nghi vấn.' },
  jailer: { vi: 'Cai Ngục', icon: '⛓️', color: '#3b82f6', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Giam cầm một người chơi mỗi đêm. Người bị giam không thể hành động và được bảo vệ. Bạn có thể xử tử họ.' },
  medium: { vi: 'Ngoại Cảm', icon: '💀', color: '#a855f7', team: 'village', teamVi: 'Phe Dân Làng', aura: 'Thiện', desc: 'Có thể trò chuyện với linh hồn những người đã chết vào ban đêm, giúp thu thập thông tin.' },
  werewolf: { vi: 'Sói Thường', icon: '🐺', color: '#ef4444', team: 'werewolf', teamVi: 'Phe Sói', aura: 'Ác', desc: 'Mỗi đêm, cùng với bầy Sói đồng bọn chọn một người chơi bất kỳ để tiêu diệt. Bạn biết rõ danh tính những con Sói khác trong bầy.' },
  alpha_wolf: { vi: 'Alpha Sói', icon: '🐺', color: '#dc2626', team: 'werewolf', teamVi: 'Phe Sói', aura: 'Ác', desc: 'Con sói đầu đàn dũng mãnh. Lá phiếu cắn người của bạn có giá trị cao nhất. Đặc biệt, hào quang của bạn hiển thị là Thiện khi bị Tiên Tri soi.' },
  wolf_seer: { vi: 'Sói Tiên Tri', icon: '🐺', color: '#b91c1c', team: 'werewolf', teamVi: 'Phe Sói', aura: 'Ác', desc: 'Mỗi đêm, bạn có quyền soi hào quang của một người chơi khác để tìm kiếm các vai trò đặc biệt của phe Dân Làng nhằm ám hại.' },
  jester: { vi: 'Kẻ Hề', icon: '🃏', color: '#f97316', team: 'solo', teamVi: 'Phe Độc Lập', aura: 'Trung Lập', desc: 'Mục tiêu độc nhất vô nhị: Làm mọi cách thuyết phục dân làng treo cổ bạn vào ban ngày. Nếu bị treo cổ thành công, bạn sẽ thắng cuộc ngay lập tức.' },
  headhunter: { vi: 'Săn Đầu Người', icon: '🎯', color: '#f97316', team: 'solo', teamVi: 'Phe Độc Lập', aura: 'Trung Lập', desc: 'Bạn có một mục tiêu bí mật. Nếu mục tiêu bị treo cổ bởi dân làng, bạn thắng!' },
  serial_killer: { vi: 'Sát Nhân', icon: '🔪', color: '#7c3aed', team: 'solo', teamVi: 'Phe Độc Lập', aura: 'Ác', desc: 'Kẻ giết người hàng loạt máu lạnh. Mỗi đêm chọn tiêu diệt một người chơi bất kỳ. Bạn miễn nhiễm với cuộc tấn công của sói. Thắng khi là người cuối cùng còn sống.' },
  arsonist: { vi: 'Hỏa Tặc', icon: '🔥', color: '#f59e0b', team: 'solo', teamVi: 'Phe Độc Lập', aura: 'Ác', desc: 'Mỗi đêm đổ dầu lên người chơi khác. Có thể kích hoạt để thiêu cháy toàn bộ những người đã bị đổ dầu cùng lúc.' },
  cupid: { vi: 'Thần Tình Yêu', icon: '💘', color: '#ec4899', team: 'solo', teamVi: 'Phe Độc Lập', aura: 'Thiện', desc: 'Đêm đầu tiên, ghép đôi 2 người chơi thành cặp đôi yêu nhau. Nếu một người chết, người kia cũng chết theo.' },
}

const TEAM_COLORS = { village: '#10b981', werewolf: '#ef4444', solo: '#f59e0b', draw: '#94a3b8' }

// Fallback dynamic configurations based on player size
const getFallbackRoles = (playerCount) => {
  if (playerCount <= 4) return ['werewolf', 'seer', 'doctor', 'villager']
  if (playerCount <= 6) return ['werewolf', 'werewolf', 'seer', 'doctor', 'villager', 'villager']
  if (playerCount <= 8) return ['werewolf', 'werewolf', 'seer', 'doctor', 'witch', 'hunter', 'villager', 'villager']
  if (playerCount <= 10) return ['werewolf', 'werewolf', 'alpha_wolf', 'seer', 'doctor', 'witch', 'hunter', 'gunner', 'villager', 'villager']
  if (playerCount <= 12) return ['werewolf', 'werewolf', 'alpha_wolf', 'seer', 'doctor', 'witch', 'hunter', 'bodyguard', 'gunner', 'jester', 'villager', 'villager']
  if (playerCount <= 16) return ['werewolf', 'werewolf', 'werewolf', 'alpha_wolf', 'seer', 'doctor', 'witch', 'hunter', 'bodyguard', 'detective', 'mayor', 'gunner', 'jailer', 'jester', 'serial_killer', 'villager']
  return ['werewolf', 'werewolf', 'werewolf', 'alpha_wolf', 'wolf_seer', 'seer', 'doctor', 'witch', 'hunter', 'bodyguard', 'detective', 'mayor', 'gunner', 'jailer', 'medium', 'cupid', 'jester', 'serial_killer', 'arsonist', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager']
}

// Custom SVG avatar component
function PlayerAvatar({ username, roleSlug, isAlive, avatarId }) {
  if (!isAlive) {
    // Beautiful Gravestone SVG matching Image 2 perfectly
    return (
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-500 opacity-90 filter drop-shadow-md">
          {/* Gravestone arch shape */}
          <path d="M30 90 L30 35 C30 18 70 18 70 35 L70 90 Z" fill="currentColor" />
          {/* Base */}
          <rect x="22" y="86" width="56" height="8" rx="2" fill="#334155" />
          {/* RIP Cross */}
          <rect x="47" y="38" width="6" height="24" fill="#334155" />
          <rect x="38" y="44" width="24" height="6" fill="#334155" />
        </svg>
        <span className="absolute text-[8px] italic font-black text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700/50 bottom-4">off</span>
      </div>
    )
  }

  return (
    <img src={`/image/${avatarId}.svg`} alt={username} className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-xl z-10 object-contain" />
  )
}

export default function GamePage() {
  const { gameId } = useParams()
  const shuffledAvatars = getShuffledAvatars(gameId)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { socket, messages, sendMessage, nightAction, vote, lastGameInit, clearGameInit } = useSocketStore()

  const [phase, setPhase] = useState('night')
  const [round, setRound] = useState(1)
  const [timer, setTimer] = useState(0)
  const [maxTimer, setMaxTimer] = useState(0)
  const [phaseTransition, setPhaseTransition] = useState(null)
  const [myRole, setMyRole] = useState(null)
  const [roleData, setRoleData] = useState({})
  const [players, setPlayers] = useState([])
  const [wolfTeam, setWolfTeam] = useState([])
  const [nightPrompt, setNightPrompt] = useState(null)
  const [voteTargets, setVoteTargets] = useState([])
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [actionSent, setActionSent] = useState(false)
  const [voteSent, setVoteSent] = useState(false)
  const [voteCounts, setVoteCounts] = useState({})
  const [voteMap, setVoteMap] = useState({})
  const [gameResult, setGameResult] = useState(null)
  const [roleReveal, setRoleReveal] = useState([])
  const [seerResults, setSeerResults] = useState([])
  const [gameEvents, setGameEvents] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatChannel, setChatChannel] = useState('public')
  const [hunterPrompt, setHunterPrompt] = useState(null)
  const [gunnerPrompt, setGunnerPrompt] = useState(null)
  const [activeSkillType, setActiveSkillType] = useState(null)
  const [selectedTargets, setSelectedTargets] = useState([])
  const [showJailerPrompt, setShowJailerPrompt] = useState(false)
  const [showGunnerPromptLocal, setShowGunnerPromptLocal] = useState(false)
  const [isJailedAtNight, setIsJailedAtNight] = useState(false)
  const [ignitedTargets, setIgnitedTargets] = useState([])

  useEffect(() => {
    setSelectedTarget(null)
    setSelectedTargets([])
  }, [phase, activeSkillType])

  // Wolf vote tracking during night phase
  const [wolfVotes, setWolfVotes] = useState({})        // wolfPlayerId -> targetId
  const [wolfVoteCounts, setWolfVoteCounts] = useState({}) // targetId -> count
  const [totalWolfAlive, setTotalWolfAlive] = useState(0)

  // Roles in the current match
  const [gameRoles, setGameRoles] = useState([])

  // Interactive enhancements
  const [showRoleTooltip, setShowRoleTooltip] = useState(false)
  const [activeNightTab, setActiveNightTab] = useState('night')
  const [speechBubbles, setSpeechBubbles] = useState({})

  const chatEndRef = useRef(null)
  const timerRef = useRef(null)

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000)
      return () => clearInterval(timerRef.current)
    }
  }, [timer])

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, gameEvents])

  // Clear speech bubbles after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setSpeechBubbles(prev => {
        const next = { ...prev }
        let changed = false
        Object.entries(next).forEach(([userId, bubble]) => {
          if (now - bubble.timestamp > 5000) {
            delete next[userId]
            changed = true
          }
        })
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto show speech bubble on card when player chats
  useEffect(() => {
    if (messages.length === 0) return
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage.sender) return
    const senderId = lastMessage.sender.id || lastMessage.sender.userId
    if (senderId) {
      setSpeechBubbles(prev => ({
        ...prev,
        [senderId]: { text: lastMessage.content, timestamp: Date.now() }
      }))
    }
  }, [messages])

  // Auto switch night panel to active tab 'night'
  useEffect(() => {
    if (phase === 'night') {
      setActiveNightTab('night')
    }
  }, [phase])

  // Initialize from cached game:init data (fixes race condition with LobbyPage navigation)
  useEffect(() => {
    if (lastGameInit && players.length === 0) {
      console.log('📦 Restoring game:init from cache:', lastGameInit.gameId)
      setPlayers(lastGameInit.players || [])
      setPhase(lastGameInit.phase || 'night')
      setRound(lastGameInit.round || 1)
      if (lastGameInit.roleList) setGameRoles(lastGameInit.roleList)
      clearGameInit()
    }
  }, [lastGameInit, players.length, clearGameInit])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handlers = {
      'game:init': (data) => {
        setPlayers(data.players)
        setPhase(data.phase)
        setRound(data.round)
        setGameEvents([]) // Clear any leftover events
        setSeerResults([])
        setRoleReveal([])
        if (data.roleList) setGameRoles(data.roleList)
      },
      'game:role_assigned': (data) => {
        setMyRole(data.role)
        setRoleData(data.roleData || {})
        const details = ROLE_DETAILS[data.role.slug] || { vi: data.role.slug, icon: '🎭' }
        toast.success(`Vai trò của bạn: ${details.vi}`, { duration: 5000, icon: details.icon })
      },
      'game:wolf_team': (data) => setWolfTeam(data.wolves),
      'game:phase_change': (data) => {
        // Show animated transition banner
        const bannerMap = {
          night: { emoji: '🌙', text: `Đêm ${data.round}`, color: '#6366f1' },
          dawn: { emoji: '☀️', text: `Bình Minh`, color: '#f59e0b' },
          discuss: { emoji: '💬', text: `Thảo Luận`, color: '#10b981' },
          vote: { emoji: '🗳️', text: `Bỏ Phiếu`, color: '#ef4444' },
          hunter_revenge: { emoji: '🏹', text: `Trả Thù`, color: '#f59e0b' },
        }
        const banner = bannerMap[data.phase]
        if (banner) {
          setPhaseTransition(banner)
          setTimeout(() => setPhaseTransition(null), 2500)
        }

        setPhase(data.phase)
        setRound(data.round)
        const dur = data.duration || 0
        setTimer(dur)
        setMaxTimer(dur)
        setSelectedTarget(null)
        setActionSent(false)
        setActiveSkillType(null)
        if (data.phase === 'vote') { setVoteSent(false); setVoteMap({}); }
        // Clear wolf votes khi đổi phase
        if (data.phase !== 'night') {
          setWolfVotes({});
          setWolfVoteCounts({});
          setIsJailedAtNight(false);
          setChatChannel('public');
        }
        if (data.phase !== 'hunter_revenge') { setHunterPrompt(null); }
        setNightPrompt(null)
        if (data.voteTargets) setVoteTargets(data.voteTargets)
        if (data.deaths) {
          data.deaths.forEach(d => {
            setPlayers(prev => prev.map(p => p.userId === d.playerId ? { ...p, isAlive: false, roleSlug: d.roleSlug || p.roleSlug } : p))
          })
        }
        if (data.events) setGameEvents(prev => [...prev, ...data.events])
        if (data.message) {
          const icon = data.phase === 'night' ? '🌙' : data.phase === 'discuss' ? '💬' : data.phase === 'vote' ? '🗳️' : '☀️'
          setGameEvents(prev => [...prev, { type: 'system', content: data.message, icon }])
        }
      },
      'game:timer': (data) => {
        const remaining = Math.max(0, Math.ceil((data.endAt - Date.now()) / 1000))
        setTimer(remaining)
        setMaxTimer(data.duration || remaining)
      },
      'game:night_action_prompt': (data) => { setNightPrompt(data); setActionSent(false); setActiveSkillType(null); },
      'game:action_confirmed': () => { setActionSent(true); toast.success('Đã xác nhận hành động!', { icon: '✅' }) },
      'game:vote_update': (data) => {
        if (data.votes) {
          setVoteMap(data.votes)
          // Đồng bộ selected target và state vote đã gửi
          const myVote = data.votes[user?.id || user?.userId]
          setSelectedTarget(myVote || null)
          if (!myVote) {
            setVoteSent(false)
          }
        }
        // Compute vote counts from vote map
        const counts = {}
        if (data.votes) {
          Object.entries(data.votes).forEach(([voterId, targetId]) => {
            const voter = players.find(pl => pl.userId === voterId)
            const voteWeight = (voter?.roleSlug === 'mayor' && voter?.roleData?.revealed) ? 2 : 1
            counts[targetId] = (counts[targetId] || 0) + voteWeight
          })
        }
        setVoteCounts(counts)
      },
      'game:mayor_revealed': (data) => {
        setPlayers(prev => prev.map(p => p.userId === data.mayorId ? { ...p, roleSlug: 'mayor', roleData: { ...p.roleData, revealed: true } } : p))
      },
      'game:vote_confirmed': (data) => { setVoteSent(true); toast.success(data?.message || 'Đã bỏ phiếu!', { icon: '🗳️' }) },
      'game:vote_result': (data) => {
        if (data.voteCounts) setVoteCounts(data.voteCounts)
        if (data.events) setGameEvents(prev => [...prev, ...data.events])
        if (data.votedOutPlayer) {
          const votedId = data.votedOutPlayer.userId || data.votedOutPlayer.playerId
          setPlayers(prev => prev.map(p => p.userId === votedId ? { ...p, isAlive: false, roleSlug: data.votedOutPlayer.roleSlug || p.roleSlug } : p))
        }
      },
      'game:seer_result': (data) => {
        setSeerResults(prev => [...prev, data])
        let displayContent = ''
        if (data.roleSlug) {
          const roleDetail = ROLE_DETAILS[data.roleSlug] || { vi: data.roleSlug, icon: '🎭' }
          displayContent = `${roleDetail.icon} ${roleDetail.vi}`
        } else {
          const auraIcon = data.aura === 'evil' ? '🔴' : '🟢'
          const auraText = data.aura === 'evil' ? 'Ác' : 'Thiện'
          displayContent = `${auraIcon} Hào quang ${auraText}`
        }
        toast(data.message || `🔮 ${data.targetUsername}: ${displayContent}`, { icon: '🔮', duration: 8000 })
        setGameEvents(prev => [...prev, { type: 'seer', content: `🔮 ${data.targetUsername}: ${displayContent}`, icon: '🔮' }])
      },
      'game:jailer_target': (data) => {
        setRoleData(prev => ({ ...prev, nextJailed: data.targetId }))
        toast.success(data.message || `⛓️ Đã chọn giam giữ mục tiêu đêm nay.`, { icon: '⛓️' })
      },
      'game:you_are_jailed': (data) => {
        if (data.jailed) {
          setIsJailedAtNight(true)
          toast.error(data.message || '⛓️ Bạn đã bị Cai Ngục giam giữ đêm nay!', { icon: '⛓️', duration: 7000 })
          setActiveNightTab('chat')
          setChatChannel('jail')
        } else {
          setRoleData(prev => ({ ...prev, nextJailed: data.jailedUserId }))
          toast.success(data.message || `⛓️ Đang giam giữ ${data.jailedUsername}`, { icon: '⛓️', duration: 7000 })
          setActiveNightTab('chat')
          setChatChannel('jail')
        }
      },
      'game:hunter_shot_prompt': (data) => setHunterPrompt(data),
      'game:hunter_shot_confirmed': (data) => setSelectedTarget(data.targetId),
      'game:hunter_shot_result': (data) => {
        setGameEvents(prev => [...prev, { type: 'hunter', content: data.message, icon: '🏹' }])
        setPlayers(prev => prev.map(p => p.userId?.toString() === data.targetId?.toString() ? { ...p, isAlive: false, roleSlug: data.targetRole || p.roleSlug } : p))
        setHunterPrompt(null)
      },
      'game:gunner_prompt': (data) => {
        setGunnerPrompt(data)
      },
      'game:gunner_shot_result': (data) => {
        setGameEvents(prev => [...prev, { type: 'gunner', content: data.message, icon: '🔫' }])
        setPlayers(prev => prev.map(p => p.userId?.toString() === data.targetId?.toString() ? { ...p, isAlive: false, roleSlug: data.targetRole || p.roleSlug } : p))
        setGunnerPrompt(null)
        toast.success(data.message, { icon: '🔫', duration: 5000 })
      },
      'game:jailer_execute_result': (data) => {
        setGameEvents(prev => [...prev, { type: 'jailer', content: data.message, icon: '☠️' }])
        setPlayers(prev => prev.map(p => p.userId?.toString() === data.targetId?.toString() ? { ...p, isAlive: false, roleSlug: data.targetRole || p.roleSlug } : p))
        toast.success(data.message, { icon: '☠️', duration: 5000 })
      },
      'game:arsonist_ignite_result': (data) => {
        setGameEvents(prev => [...prev, { type: 'arsonist', content: data.message, icon: '🔥' }])
        if (data.targetIds && data.targetIds.length > 0) {
          const stringTargetIds = data.targetIds.map(id => id?.toString());
          setIgnitedTargets(stringTargetIds);
          setTimeout(() => {
            setIgnitedTargets([]);
            setPlayers(prev => prev.map(p => stringTargetIds.includes(p.userId?.toString()) ? { ...p, isAlive: false, roleSlug: (data.roleReveals && data.roleReveals[p.userId]) || p.roleSlug } : p))
          }, 1500);
        } else {
          setPlayers(prev => prev.map(p => data.targetIds?.map(id => id?.toString())?.includes(p.userId?.toString()) ? { ...p, isAlive: false, roleSlug: (data.roleReveals && data.roleReveals[p.userId]) || p.roleSlug } : p))
        }
        toast.success(data.message, { icon: '🔥', duration: 5000 })
      },
      'game:players_update': (data) => {
        if (data.players) setPlayers(data.players)
      },
      'game:ended': (data) => {
        setGameResult(data)
        setRoleReveal(data.roleReveal || [])
        setPhase('ended')
        setGameEvents(prev => [...prev, { type: 'game_end', content: data.reason, icon: '🏁' }])
      },
      'game:state_sync': (data) => {
        setPlayers(data.players)
        setPhase(data.phase)
        setRound(data.round)
        setMyRole(data.role)
        setRoleData(data.roleData || {})
        if (data.roleList) setGameRoles(data.roleList)

        // Phục hồi lịch sử check của Tiên Tri / Thám Tử khi kết nối lại hoặc F5
        if (data.roleData) {
          let restoredChecks = []
          if (data.role?.slug === 'detective' && data.roleData.investigations) {
            restoredChecks = data.roleData.investigations
            setSeerResults(restoredChecks)
          } else if (data.roleData.checks) {
            restoredChecks = data.roleData.checks
            setSeerResults(restoredChecks)
          }

          // Tái dựng các sự kiện check trong Lịch Sử (gameEvents)
          if (restoredChecks.length > 0) {
            const reconstructedEvents = restoredChecks.map(c => {
              let displayContent = ''
              if (c.roleSlug) {
                const roleDetail = ROLE_DETAILS[c.roleSlug] || { vi: c.roleSlug, icon: '🎭' }
                displayContent = `${roleDetail.icon} ${roleDetail.vi}`
              } else if (c.message) {
                return {
                  type: 'seer',
                  content: c.message,
                  icon: '🔍',
                  round: c.round
                }
              } else {
                const auraIcon = c.aura === 'evil' ? '🔴' : '🟢'
                const auraText = c.aura === 'evil' ? 'Ác' : 'Thiện'
                displayContent = `${auraIcon} Hào quang ${auraText}`
              }
              return {
                type: 'seer',
                content: `🔮 ${c.targetUsername}: ${displayContent}`,
                icon: '🔮',
                round: c.round
              }
            })
            setGameEvents(prev => {
              const filteredPrev = prev.filter(e => e.type !== 'seer')
              return [...filteredPrev, ...reconstructedEvents]
            })
          }
        }
      },
      // Wolf vote updates during night (sói thấy đồng đội vote ai)
      'game:wolf_vote_update': (data) => {
        setWolfVotes(data.wolfVotes || {})
        setWolfVoteCounts(data.wolfVoteCounts || {})
        setTotalWolfAlive(data.totalWolfAlive || 0)
      },
    }

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler))
    socket.emit('game:request_state', { gameId })
    return () => { Object.keys(handlers).forEach(event => socket.off(event)) }
  }, [socket, gameId])

  function handleSendChat(e) {
    e.preventDefault()
    if (!chatInput.trim()) return
    sendMessage(chatInput, chatChannel)
    setChatInput('')
  }

  function handleNightAction(targetId) {
    if (!nightPrompt) return
    const isCheckRole = ['seer', 'detective', 'wolf_seer'].includes(myRole?.slug)
    if (isCheckRole && actionSent) return

    let currentActionType = nightPrompt.actionType;
    if (nightPrompt.actions) {
       if (!activeSkillType) return toast.error('Vui lòng chọn một kỹ năng trước', { icon: '⚠️' })
       currentActionType = activeSkillType
    }

    setSelectedTarget(targetId)
    if (isCheckRole) setActionSent(true)
    nightAction(currentActionType, targetId)
  }

  function handleVote(targetId) {
    setSelectedTarget(targetId)
    setVoteSent(true)
    vote(targetId)
  }

  function handleHunterShot(targetId) {
    setSelectedTarget(targetId)
    socket?.emit('game:hunter_shot', { target_id: targetId })
    toast.success(`Đã chọn bắn mục tiêu #${players.find(p => p.userId === targetId)?.seatNumber}`, { icon: '🏹' })
  }

  const roleInfo = ROLE_DETAILS[myRole?.slug] || { vi: 'Chưa rõ', icon: '❓', color: '#9ca3af', desc: 'Không rõ mô tả.' }
  const myPlayer = players.find(p => p.userId === user?.id)
  const isAlive = myPlayer?.isAlive !== false
  const isNight = phase === 'night'

  // Dynamic layout colors depending on Night vs Day (discuss/vote)
  const mainBg = isNight ? 'bg-[#151c27]' : 'bg-[#eaeaea]'
  const sidebarBg = isNight ? 'bg-[#18202d] text-white' : 'bg-[#f1f5f9] text-slate-800'
  const sidebarBorder = isNight ? 'border-slate-800/80' : 'border-slate-300'
  const textPrimary = isNight ? 'text-white' : 'text-slate-800'
  const textSecondary = isNight ? 'text-slate-400' : 'text-slate-500'
  const cardBg = isNight ? 'bg-[#222d3e]/60 border-[#2d3a4f]' : 'bg-[#1a2230] border-slate-700/80 shadow-md'
  const activeTabStyle = isNight ? 'bg-[#18202d] border-b-2 border-indigo-500 text-white' : 'bg-[#f1f5f9] border-b-2 border-indigo-600 text-slate-900 font-extrabold'

  const canChat = isAlive && (phase === 'discuss' || phase === 'vote' || (phase === 'night' && myRole?.team === 'werewolf'))

  const isMultiTargetAction = phase === 'night' && (
    (nightPrompt?.actionType === 'detective_investigate') ||
    (activeSkillType === 'detective_investigate') ||
    (activeSkillType === 'arsonist_douse') ||
    (nightPrompt?.actionType === 'cupid_link') ||
    (activeSkillType === 'cupid_link')
  );

  // Sort players by seatNumber to keep fixed positions (1-12)
  const sortedPlayers = [...players].sort((a, b) => (a.seatNumber || 0) - (b.seatNumber || 0))

  // Dynamic role list in game
  const currentRolesList = gameRoles.length > 0 ? gameRoles : getFallbackRoles(players.length)
  
  // Calculate how many of each role are dead to dim the correct number of icons
  const deadRoleCounts = {}
  players.forEach(p => {
    if (!p.isAlive && p.roleSlug) {
      deadRoleCounts[p.roleSlug] = (deadRoleCounts[p.roleSlug] || 0) + 1
    }
  })

  // To keep track during rendering
  const roleRenderCount = {}

  return (
    <div className={`min-h-screen ${mainBg} text-white flex flex-row overflow-hidden font-sans transition-colors duration-1000`}>
      
      {/* LEFT COLUMN: Sidebar panel replication of Image 2 & 3 */}
      <aside className={`w-96 min-w-[360px] h-screen ${sidebarBg} border-r ${sidebarBorder} flex flex-col justify-between overflow-hidden shadow-2xl relative z-10 transition-colors duration-1000`}>
        
        {/* Left Sidebar Header */}
        <div className={`flex items-center justify-between p-3 border-b ${sidebarBorder}`}>
          <button onClick={() => {
            useSocketStore.getState().leaveLobby();
            navigate('/');
          }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isNight ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-slate-800'}`}>
            <span className="text-xl font-bold">✕</span>
          </button>
          
          <div className="flex flex-col items-center">
            <span className={`text-sm font-extrabold tracking-wide ${textPrimary}`}>
              Vòng {round} —{' '}
              <span style={{ color: phase === 'night' ? '#6366f1' : phase === 'discuss' ? '#10b981' : phase === 'vote' ? '#ef4444' : '#f59e0b' }}>
                {phase === 'night' ? '🌙 Night' : phase === 'discuss' ? '💬 Discussion' : phase === 'vote' ? '🗳️ Voting' : phase === 'dawn' ? '☀️ Dawn' : '🏁 Ended'}
              </span>
            </span>
            <span className={`text-xs font-mono font-black ${timer <= 10 ? 'text-red-400 animate-pulse' : timer <= 20 ? 'text-amber-400' : 'text-indigo-500'}`}>
              {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className={`p-1 rounded transition-colors ${isNight ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/10 text-slate-600'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button className={`p-1 rounded transition-colors ${isNight ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/10 text-slate-600'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button className={`p-1 rounded transition-colors ${isNight ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/10 text-slate-600'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Roles configuration list grid - styled as in Image 2 & 3. DIMS disabled roles (Task 2) */}
        <div className={`p-2 border-b ${sidebarBorder} grid grid-cols-8 gap-1.5 bg-black/10`}>
          {currentRolesList.map((roleSlug, index) => {
            const role = ROLE_DETAILS[roleSlug] || { vi: roleSlug, icon: '🎭', color: '#9ca3af' }
            
            const currentRenderIndex = roleRenderCount[roleSlug] || 0
            const disabled = currentRenderIndex < (deadRoleCounts[roleSlug] || 0)
            roleRenderCount[roleSlug] = currentRenderIndex + 1

            return (
              <div key={`${roleSlug}-${index}`} className={`group relative flex flex-col items-center justify-center p-1 rounded hover:bg-black/25 cursor-help transition-all duration-300 ${
                disabled ? 'opacity-25 filter grayscale pointer-events-none' : ''
              }`}>
                <span className="text-xl sm:text-2xl filter drop-shadow-sm transition-transform duration-200 group-hover:scale-110">{role.icon}</span>
                <span className="text-[8px] scale-[0.8] origin-center truncate w-full text-center mt-0.5 opacity-95 font-black" style={{ color: role.color }}>
                  {role.vi}
                </span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-50 w-44 bg-slate-900 text-white text-[10px] p-2 rounded shadow-2xl border border-slate-700 pointer-events-none">
                  <div className="font-bold mb-1" style={{ color: role.color }}>{role.vi}</div>
                  <div>{role.desc || 'Vai trò trong trò chơi Wolvesville Việt Nam.'}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Left Column Body: Dynamic panels depending on Phase */}
        {phase === 'night' ? (
          /* NIGHT INTERFACE (Task 3 - Night chat replica) */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Night tab selection bar */}
            <div className="flex border-b border-slate-800/80 bg-black/25">
              <button onClick={() => setActiveNightTab('night')}
                className={`flex-1 py-3 text-xs font-black transition-colors flex items-center justify-center gap-1.5 ${activeNightTab === 'night' ? activeTabStyle : 'text-slate-500 hover:text-slate-300'}`}>
                <span>Night</span>
                <span className="text-sm">🌙</span>
              </button>
              <button onClick={() => setActiveNightTab('history')}
                className={`flex-1 py-3 text-xs font-black transition-colors flex items-center justify-center gap-1.5 ${activeNightTab === 'history' ? activeTabStyle : 'text-slate-500 hover:text-slate-300'}`}>
                <span>Lịch sử</span>
                <span className="text-sm">📜</span>
              </button>
              <button onClick={() => setActiveNightTab('chat')}
                className={`flex-1 py-3 text-xs font-black transition-colors flex items-center justify-center gap-1.5 ${activeNightTab === 'chat' ? activeTabStyle : 'text-slate-500 hover:text-slate-300'}`}>
                <span>Chat</span>
                <span className="text-sm">💬</span>
              </button>
            </div>

            {/* Night tab content */}
            {activeNightTab === 'night' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 overflow-y-auto">
                <motion.h2 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-black text-indigo-400 tracking-wider animate-pulse">
                  Đêm {round}
                </motion.h2>
                
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                  className="text-xs font-bold text-slate-300 leading-relaxed max-w-[85%] bg-black/20 p-4 rounded-2xl border border-slate-800">
                  {isJailedAtNight ? (
                    <span className="text-blue-400 font-extrabold animate-pulse">⛓️ Bạn đang bị Cai Ngục giam giữ! Mọi kỹ năng của bạn đã bị khóa và bạn được bảo vệ tuyệt đối đêm nay. Hãy chuyển sang tab Chat 💬 để trò chuyện với Cai Ngục!</span>
                  ) : (
                    nightPrompt?.actionLabel || (
                      myRole?.slug === 'werewolf' || myRole?.slug === 'alpha_wolf' || myRole?.slug === 'wolf_seer' 
                        ? 'Chọn một người chơi cùng đàn Sói để cắn chết đêm nay.'
                        : myRole?.slug === 'doctor'
                        ? 'Chọn cứu sống một người chơi đêm nay. Bạn không thể tự cứu 2 đêm liên tiếp.'
                        : myRole?.slug === 'seer'
                        ? 'Chọn một người chơi để soi hào quang (Thiện hoặc Ác).'
                        : myRole?.slug === 'bodyguard'
                        ? 'Chọn một người chơi để bảo vệ. Bạn sẽ hi sinh nếu họ bị tấn công.'
                        : myRole?.slug === 'witch'
                        ? 'Quyết định sử dụng bình thuốc cứu mạng hoặc bình độc dược.'
                        : 'Đang ngủ ngon lành... Hãy nhắm mắt và chờ đợi các vai trò hành động đêm.'
                    )
                  )}
                </motion.div>

                {/* WOLF TEAM INFO — Hiển thị đồng đội sói */}
                {myRole?.team === 'werewolf' && wolfTeam.length > 0 && (
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="w-full max-w-[85%] bg-rose-950/40 border border-rose-800/50 rounded-2xl p-3 space-y-2">
                    <div className="text-[10px] uppercase font-black text-rose-400 tracking-widest flex items-center gap-1">
                      <span>🐺</span> Đồng đội Sói
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {wolfTeam.map(w => {
                        const wolfPlayer = players.find(p => p.userId === w.userId)
                        const wolfAlive = wolfPlayer?.isAlive !== false
                        return (
                          <div key={w.userId} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
                            wolfAlive 
                              ? 'bg-rose-900/50 border-rose-600/40 text-rose-200' 
                              : 'bg-slate-900/50 border-slate-700/40 text-slate-500 line-through opacity-50'
                          }`}>
                            <span>{wolfAlive ? '🐺' : '💀'}</span>
                            <span>#{w.seatNumber} {w.username}</span>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {/* WOLF VOTE STATUS — Tình trạng vote kill của sói */}
                {myRole?.team === 'werewolf' && Object.keys(wolfVoteCounts).length > 0 && (
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="w-full max-w-[85%] bg-rose-950/30 border border-rose-800/40 rounded-2xl p-3 space-y-2">
                    <div className="text-[10px] uppercase font-black text-rose-400 tracking-widest flex items-center gap-1">
                      <span>🗳️</span> Vote Kill ({Object.keys(wolfVotes).length}/{totalWolfAlive} sói đã vote)
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(wolfVoteCounts)
                        .sort(([,a], [,b]) => b - a)
                        .map(([targetId, count]) => {
                          const target = players.find(p => p.userId === targetId)
                          const voterSeats = Object.entries(wolfVotes)
                            .filter(([, tid]) => tid === targetId)
                            .map(([vid]) => {
                              const v = players.find(p => p.userId === vid)
                              return v ? `#${v.seatNumber}` : '?'
                            })
                          return (
                            <div key={targetId} className="flex items-center gap-2 text-xs">
                              <span className="bg-rose-800 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black">{count}</span>
                              <span className="text-rose-200 font-bold">#{target?.seatNumber} {target?.username || '???'}</span>
                              <span className="text-rose-400/60 text-[9px]">← {voterSeats.join(', ')}</span>
                              {count > totalWolfAlive / 2 && (
                                <span className="text-emerald-400 text-[9px] font-black animate-pulse">✓ Đa số</span>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </motion.div>
                )}

                {actionSent && (
                  <div className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 animate-pulse uppercase tracking-wider">
                    ✓ Đã gửi hành động đêm
                  </div>
                )}
              </div>
            ) : activeNightTab === 'history' ? (
              /* Event History log (during night phase) */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {gameEvents.length === 0 ? (
                    <div className="text-[10px] text-center italic text-slate-500 py-4">
                      Chưa có sự kiện nào diễn ra.
                    </div>
                  ) : gameEvents.map((evt, i) => (
                    <div key={i} className={`text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1.5 ${
                      evt.type === 'death'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : evt.type === 'vote' || evt.type === 'vote_death'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : evt.type === 'game_end'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : evt.type === 'hunter' || evt.type === 'gunner'
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : evt.type === 'seer'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-black/10 text-slate-400 border border-slate-700/40'
                    }`}>
                      {evt.icon && <span className="text-xs">{evt.icon}</span>}
                      <span className="flex-1">{evt.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Day chat history (during night phase) */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex border-b border-slate-800/80 bg-black/10">
                  {(() => {
                    const channels = ['public'];
                    if (myRole?.team === 'werewolf') channels.push('wolf');
                    if (!isAlive) channels.push('dead');
                    if ((myRole?.slug === 'jailer' && roleData?.nextJailed) || isJailedAtNight) {
                      channels.push('jail');
                    }
                    return channels;
                  })().map(ch => (
                    <button key={ch} onClick={() => setChatChannel(ch)}
                      className={`flex-1 py-2 text-[10px] font-black transition-colors ${chatChannel === ch ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>
                      {ch === 'public' ? '💬 Chung' : ch === 'wolf' ? '🐺 Sói' : ch === 'dead' ? '💀 Âm Hồn' : '⛓️ Giam Ngục'}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 font-medium">
                  {messages.filter(m => !m.channel || m.channel === chatChannel).map((m, i) => (
                    <div key={m.id || i} className="text-xs">
                      {m.sender ? (
                        <>
                          <span className="font-black text-indigo-300">
                            {m.sender.seatNumber ? `${m.sender.seatNumber} ` : ''}{m.sender.username}:
                          </span>
                          <span className="ml-1 text-slate-200">{m.content}</span>
                        </>
                      ) : (
                        <span className="text-slate-500 italic">{m.content}</span>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* DAY / DISCUSS / VOTE INTERFACE (Task 2 - Left Panel replica) */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Full events log - scrollable and persistent across phases */}
            <div className="p-3 bg-black/5 space-y-1.5 max-h-48 overflow-y-auto border-b border-dashed border-slate-300/30 scrollbar-thin">
              {gameEvents.map((evt, i) => (
                <div key={i} className={`text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1.5 ${
                  evt.type === 'death' 
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' 
                    : evt.type === 'vote' || evt.type === 'vote_death'
                    ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                    : evt.type === 'game_end' 
                    ? 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20'
                    : evt.type === 'hunter' || evt.type === 'gunner'
                    ? 'bg-orange-500/10 text-orange-700 border border-orange-500/20'
                    : evt.type === 'seer'
                    ? 'bg-purple-500/10 text-purple-700 border border-purple-500/20'
                    : 'bg-black/5 text-slate-600 border border-slate-300/40'
                }`}>
                  {evt.icon && <span className="text-xs">{evt.icon}</span>}
                  <span className="flex-1">{evt.content}</span>
                </div>
              ))}
              {gameEvents.length === 0 && (
                <div className="text-[10px] text-center italic text-slate-400 py-1">
                  Chưa có sự kiện nổi bật diễn ra.
                </div>
              )}
            </div>

            {/* Chat selector */}
            <div className={`flex border-b ${sidebarBorder} bg-black/5`}>
              {['public', ...(myRole?.team === 'werewolf' ? ['wolf'] : []), ...(!isAlive ? ['dead'] : [])].map(ch => (
                <button key={ch} onClick={() => setChatChannel(ch)}
                  className={`flex-1 py-2.5 text-[10px] font-extrabold transition-colors ${chatChannel === ch ? 'text-indigo-600 border-b-2 border-indigo-600 font-black' : 'text-slate-500 hover:text-slate-700'}`}>
                  {ch === 'public' ? '💬 Chung' : ch === 'wolf' ? '🐺 Sói' : '💀 Âm Hồn'}
                </button>
              ))}
            </div>

            {/* Day Chat list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-hide">
              {messages.filter(m => !m.channel || m.channel === chatChannel).map((m, i) => (
                <div key={m.id || i} className="text-xs leading-relaxed">
                  {m.sender ? (
                    <>
                      <span className="font-extrabold text-slate-800">
                        {m.sender.seatNumber ? `${m.sender.seatNumber} ` : ''}{m.sender.username}:
                      </span>
                      <span className="ml-1 text-slate-600 font-bold">{m.content}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 italic font-bold">{m.content}</span>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Input box form styled exactly like Image 2 */}
        {((phase === 'night' && activeNightTab === 'chat') || phase !== 'night') && canChat && (
          <form onSubmit={handleSendChat} className={`p-3 border-t ${sidebarBorder} ${isNight ? 'bg-black/25' : 'bg-slate-200/50'}`}>
            <div className="relative flex items-center">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className={`w-full rounded-xl pl-3 pr-10 py-2.5 text-xs outline-none transition-all ${
                  isNight
                    ? 'bg-[#1e2637] text-white border border-slate-700 focus:border-indigo-500 placeholder-slate-500'
                    : 'bg-white text-slate-800 border border-slate-300 focus:border-indigo-500 placeholder-slate-400 shadow-inner'
                }`}
                placeholder="Type your message"
                maxLength={300}
              />
              <button type="submit" className="absolute right-3 text-indigo-600 hover:text-indigo-500 transition-colors">
                <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </aside>

      {/* RIGHT COLUMN: Player grid panel styled as in Image 2 & 3 */}
      <main className="flex-1 h-screen flex flex-col overflow-hidden relative">
        
        {/* TOP STATUS BAR: Features the Role Badge Hover and Hold (Task 1) */}
        <header className={`flex items-center justify-between px-6 py-2.5 border-b relative z-20 ${
          isNight ? 'bg-slate-900/40 border-slate-800/60' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="flex items-center gap-4">
            <span className="text-xl">⚔️</span>
            <div>
              <h2 className={`text-sm font-extrabold ${isNight ? 'text-white' : 'text-slate-800'}`}>Wolvesville Việt Nam</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Ván #{gameId?.slice(0, 8)}</span>
                {!isNight && phase !== 'ended' && (
                  <span className="text-[10px] text-indigo-500 font-extrabold animate-pulse">
                    • {players.filter(p => p.isAlive).length} người sống (Cần ≥{Math.floor(players.filter(p => p.isAlive).length / 2)} phiếu để treo cổ)
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
            {/* Timer with progress bar */}
            <div className="flex flex-col items-center gap-0.5">
              <div className={`font-mono text-base font-extrabold px-3 py-1 rounded-lg ${
                timer <= 10 
                  ? 'text-red-400 animate-pulse bg-red-500/10 border border-red-500/20' 
                  : timer <= 20
                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                  : isNight
                  ? 'text-slate-300 bg-slate-800/60 border border-slate-700/40'
                  : 'text-slate-800 bg-slate-200 border border-slate-300'
              }`}>
                {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
              </div>
              {maxTimer > 0 && (
                <div className="w-full h-1 rounded-full bg-slate-700/40 overflow-hidden" style={{ minWidth: '60px' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={false}
                    animate={{ width: `${Math.max(0, (timer / maxTimer) * 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      background: timer <= 10 ? '#ef4444' : timer <= 20 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </div>
              )}
            </div>

            {/* TASK 1: Role Badge supporting hover and hold */}
            <div 
              onMouseEnter={() => setShowRoleTooltip(true)}
              onMouseLeave={() => setShowRoleTooltip(false)}
              onTouchStart={() => setShowRoleTooltip(true)}
              onTouchEnd={() => setShowRoleTooltip(false)}
              onClick={() => setShowRoleTooltip(!showRoleTooltip)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border cursor-pointer select-none transition-all duration-300 hover:scale-105 active:scale-95 shadow-md"
              style={{ borderColor: roleInfo.color + '60', background: roleInfo.color + '15' }}
            >
              <span className="text-base">{roleInfo.icon}</span>
              <span className="text-xs font-black tracking-wide" style={{ color: roleInfo.color }}>{roleInfo.vi}</span>
            </div>

            {/* Exit/Thoát Button */}
            <button onClick={() => {
              useSocketStore.getState().leaveLobby();
              navigate('/');
            }} className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              isNight
                ? 'text-slate-400 hover:text-white border-slate-800 hover:border-slate-600'
                : 'text-slate-600 hover:text-slate-900 border-slate-300 hover:border-slate-400'
            }`}>
              Thoát
            </button>

            {/* Task 1 Role Tooltip Overlay Card */}
            <AnimatePresence>
              {showRoleTooltip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  className="absolute right-0 top-11 z-50 w-72 bg-slate-950/95 border-2 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.5)] backdrop-blur-md"
                  style={{ borderColor: roleInfo.color }}
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <span className="text-3xl filter drop-shadow-sm">{roleInfo.icon}</span>
                    <div>
                      <h4 className="font-extrabold text-base text-white">{roleInfo.vi}</h4>
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-60" style={{ color: roleInfo.color }}>
                        {myRole?.slug}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      myRole?.team === 'werewolf' 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : myRole?.team === 'solo'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {myRole?.team === 'werewolf' ? '🔴 Phe Sói' : myRole?.team === 'solo' ? '🟡 Phe Độc Lập' : '🟢 Phe Dân Làng'}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      ✨ Hào quang: {roleInfo.aura || 'Thiện'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    {roleInfo.desc}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* TASK 2: Player Grid (arranged in 4 columns with background forest trees) */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-4 gap-4 pb-24 scrollbar-hide z-0">
          {sortedPlayers.map((p) => {
            const isMe = p.userId === user?.id
            const isWolf = wolfTeam.find(w => w.userId === p.userId)
            const revealed = roleReveal.find(r => r.userId === p.userId)
            const seerCheck = seerResults.find(s => s.targetId === p.userId)
            const hasBubble = speechBubbles[p.userId]
            const targetColor = isNight ? '#6366f1' : '#f43f5e'

            // Dynamic vote count badge (Task 3 / Image 2 dynamic vote representation)
            const pVotes = voteCounts[p.userId] || 0
            // Who voted for this player?
            const votersForThis = Object.entries(voteMap).filter(([, tid]) => tid === p.userId).map(([vid]) => {
              const voter = players.find(pl => pl.userId === vid)
              return voter ? voter.seatNumber : '?'
            })

            // Wolf vote tracking during night
            const isWolfTeam = myRole?.team === 'werewolf'
            const wolfVotesForThis = wolfVoteCounts[p.userId] || 0
            const wolfVotersForThis = Object.entries(wolfVotes).filter(([, tid]) => tid === p.userId).map(([vid]) => {
              const voter = players.find(pl => pl.userId === vid)
              return voter ? voter.seatNumber : '?'
            })

            // Action eligibility - allow changing target for protector roles
            const isCheckRole = ['seer', 'detective', 'wolf_seer'].includes(myRole?.slug)
            
            const isSelected = selectedTarget === p.userId || selectedTargets.includes(p.userId)
            const isDoused = roleData?.doused?.includes(p.userId)
            const showArsonistFire = (myRole?.slug === 'arsonist' && isDoused && activeSkillType === 'arsonist_ignite') || ignitedTargets.includes(p.userId?.toString())
            const showJailerEffect = p.isAlive && ((phase === 'night' && ((myRole?.slug === 'jailer' && roleData?.nextJailed?.toString() === p.userId?.toString()) || (isJailedAtNight && p.userId?.toString() === user?.id?.toString()))) || (myRole?.slug === 'jailer' && isSelected))
            
            const currentTargets = nightPrompt?.actions 
                ? (nightPrompt.actions.find(a => a.type === activeSkillType)?.targets || []) 
                : (nightPrompt?.targets || [])

            const isTargetable = (phase === 'night' && !isJailedAtNight && nightPrompt && isAlive && (!actionSent || !isCheckRole) && currentTargets.some(t => t.userId === p.userId)) ||
                                (phase === 'vote' && isAlive && p.isAlive && voteTargets.some(t => t.userId === p.userId) && p.userId !== user?.id) ||
                                (phase === 'hunter_revenge' && hunterPrompt && hunterPrompt.targets.some(t => t.userId === p.userId))

            const handlePlayerClick = () => {
              if (!isTargetable) return
              if (phase === 'night') {
                if (isMultiTargetAction) {
                  if (selectedTargets.includes(p.userId)) {
                    setSelectedTargets(prev => prev.filter(id => id !== p.userId))
                  } else {
                    if (selectedTargets.length < 2) {
                      setSelectedTargets(prev => [...prev, p.userId])
                    } else {
                      toast.error('Chỉ được chọn tối đa 2 người', { icon: '⚠️' })
                    }
                  }
                } else {
                  handleNightAction(p.userId)
                }
              }
              if (phase === 'vote') handleVote(p.userId)
              if (phase === 'hunter_revenge') handleHunterShot(p.userId)
            }

            return (
              <motion.div
                key={p.userId}
                layout
                onClick={handlePlayerClick}
                className={`relative rounded-2xl overflow-hidden aspect-video border transition-all duration-300 ${
                  !p.isAlive 
                    ? 'border-slate-900 bg-slate-950/60 shadow-inner' 
                    : isMe
                    ? 'border-indigo-500 bg-gradient-to-b from-[#253249] to-[#121929] shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-2 ring-indigo-500/20'
                    : isTargetable
                    ? 'border-amber-500 bg-gradient-to-b from-[#2e3e60] to-[#121929] hover:scale-102 hover:shadow-lg cursor-pointer hover:border-amber-400'
                    : isNight && isWolf && isWolfTeam && !isMe
                    ? 'border-rose-600/80 bg-gradient-to-b from-[#3a1525] to-[#1a0a12] shadow-[0_0_12px_rgba(239,68,68,0.25)] ring-1 ring-rose-500/30'
                    : 'border-slate-800 bg-[#1a2230]'
                } ${selectedTarget === p.userId || selectedTargets.includes(p.userId) ? `ring-4 ring-offset-2 ring-offset-[#151c27]` : ''}`}
                style={selectedTarget === p.userId || selectedTargets.includes(p.userId) ? { ringColor: targetColor } : {}}
              >
                {/* Forest night silhoutte inside each card (reproducing Image 2 & 3 style) */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                  <svg className="absolute bottom-0 left-0 w-full h-1/2" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <path d="M0 40 L5 20 L10 40 L15 15 L20 40 L28 10 L35 40 L40 22 L48 40 L55 18 L60 40 L68 12 L75 40 L82 25 L90 40 L95 18 L100 40 Z" fill="#000" />
                  </svg>
                  <svg className="absolute bottom-0 left-0 w-full h-1/3" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d="M0 30 L8 10 L15 30 L22 5 L30 30 L38 12 L45 30 L55 8 L65 30 L72 15 L80 30 L88 5 L95 30 L100 12 Z" fill="#000" />
                  </svg>
                </div>

                {/* Card Header Info */}
                <div className={`absolute top-2.5 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black z-10 ${
                  isMe ? 'bg-indigo-600 text-white shadow-sm' : 'bg-black/40 text-slate-200'
                }`}>
                  {p.seatNumber} {p.username} {isMe && '(Bạn)'}
                </div>

                {/* Revealed Mayor Crown Overlay */}
                {p.isAlive && p.roleSlug === 'mayor' && p.roleData?.revealed && (
                  <div className="absolute top-2.5 right-2 w-7 h-7 rounded-full bg-amber-900/90 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] flex items-center justify-center z-20 animate-bounce">
                    <span className="text-sm">👑</span>
                  </div>
                )}

                {/* Card Avatar / Gravestone (Task 2) */}
                <div className="absolute inset-0 flex items-center justify-center pt-2">
                  <PlayerAvatar username={p.username} roleSlug={p.roleSlug || (isMe ? myRole?.slug : (revealed?.roleSlug || ''))} isAlive={p.isAlive} avatarId={shuffledAvatars[(p.seatNumber - 1) % 12]} />
                </div>

                {/* Role / Team overlays / Jailed handcuffs */}
                <div className="absolute bottom-2 left-2 flex gap-1 z-10">
                  {!p.isAlive && (
                    <span className="text-[9px] bg-red-950/70 border border-red-500/20 text-red-400 font-extrabold px-1.5 py-0.5 rounded shadow">
                      💀 R.I.P
                    </span>
                  )}
                  {isWolf && p.isAlive && (
                    <span className="text-[9px] bg-rose-950/70 border border-rose-500/20 text-rose-400 font-extrabold px-1.5 py-0.5 rounded shadow">
                      🐺 Sói
                    </span>
                  )}
                  {myRole?.slug === 'jailer' && roleData?.nextJailed === p.userId && (
                    <span className="text-[9px] bg-blue-950/70 border border-blue-500/20 text-blue-400 font-extrabold px-1.5 py-0.5 rounded shadow">
                      ⛓️ Sẽ giam
                    </span>
                  )}
                  {seerCheck && (
                    seerCheck.roleSlug ? (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border shadow" style={{ 
                        borderColor: (ROLE_DETAILS[seerCheck.roleSlug]?.color || '#a855f7') + '40', 
                        background: (ROLE_DETAILS[seerCheck.roleSlug]?.color || '#a855f7') + '20', 
                        color: ROLE_DETAILS[seerCheck.roleSlug]?.color || '#a855f7' 
                      }}>
                        🔮 {ROLE_DETAILS[seerCheck.roleSlug]?.icon} {ROLE_DETAILS[seerCheck.roleSlug]?.vi}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-purple-950/70 border border-purple-500/20 text-purple-400 font-extrabold px-1.5 py-0.5 rounded shadow">
                        🔮 {seerCheck.aura === 'good' ? 'Thiện' : 'Ác'}
                      </span>
                    )
                  )}
                  {p.roleSlug && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border shadow" style={{ 
                      borderColor: ROLE_DETAILS[p.roleSlug]?.color + '40', 
                      background: ROLE_DETAILS[p.roleSlug]?.color + '20', 
                      color: ROLE_DETAILS[p.roleSlug]?.color 
                    }}>
                      {ROLE_DETAILS[p.roleSlug]?.icon} {ROLE_DETAILS[p.roleSlug]?.vi}
                    </span>
                  )}
                </div>

                {/* Dead revealed role icon overlay (bottom right of card exactly like Image 2) */}
                {!p.isAlive && p.roleSlug && (
                  <div className="absolute bottom-2.5 right-2 w-8 h-8 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg flex items-center justify-center z-20 hover:scale-105 transition-transform cursor-help group">
                    <span className="text-base filter drop-shadow">{ROLE_DETAILS[p.roleSlug]?.icon}</span>
                    <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-50 w-24 bg-slate-950 text-white text-[8px] p-1.5 rounded border border-slate-700 text-center font-bold">
                      {ROLE_DETAILS[p.roleSlug]?.vi}
                    </div>
                  </div>
                )}

                {/* Vote Count Banner with voter seat numbers */}
                {phase === 'vote' && pVotes > 0 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-1 bg-amber-800/90 text-amber-100 font-black text-[9px] px-2 py-1 rounded-md border border-amber-600 shadow-md backdrop-blur-sm">
                    <span className="bg-amber-950 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{pVotes}</span>
                    <span>Vote</span>
                    <span className="text-amber-300 ml-0.5">({votersForThis.join(', ')})</span>
                  </div>
                )}
                {/* Show who I voted for */}
                {phase === 'vote' && selectedTarget === p.userId && (
                  <div className="absolute top-2 right-2 z-20 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                    ✓ Phiếu của bạn
                  </div>
                )}

                {/* Wolf vote count during night (chỉ sói thấy) */}
                {isNight && isWolfTeam && wolfVotesForThis > 0 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-1 bg-rose-900/90 text-rose-100 font-black text-[9px] px-2 py-1 rounded-md border border-rose-600 shadow-md backdrop-blur-sm">
                    <span className="bg-rose-950 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{wolfVotesForThis}</span>
                    <span>🐺 Kill</span>
                    <span className="text-rose-300 ml-0.5">({wolfVotersForThis.join(', ')})</span>
                    {wolfVotesForThis === totalWolfAlive && totalWolfAlive > 1 && (
                      <span className="text-emerald-400 ml-0.5 animate-pulse">✓</span>
                    )}
                  </div>
                )}

                {/* Visual Skill Effects Overlay */}
                <AnimatePresence>
                  {(isSelected || showArsonistFire || showJailerEffect) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-black/10 backdrop-blur-[0.5px]"
                    >
                      {/* Vote Effect - Pointing Hand (Hình 1 bàn tay chỉ vào mục tiêu) */}
                      {phase === 'vote' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-rose-500/10 border-2 border-rose-500/80 rounded-2xl shadow-[inset_0_0_20px_rgba(244,63,94,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ scale: [1, 1.25, 1], y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]"
                          >
                            🫵
                          </motion.div>
                        </div>
                      )}

                      {/* Visual Skill Effects Overlay (Only when not in vote phase) */}
                      {phase !== 'vote' && (
                        <>
                          {/* Bodyguard (Vệ Sĩ) - Golden pulsing medieval shield */}
                          {myRole?.slug === 'bodyguard' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-yellow-500/10 border-2 border-yellow-400/80 rounded-2xl shadow-[inset_0_0_20px_rgba(234,179,8,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]"
                          >
                            🛡️
                          </motion.div>
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 border-4 border-yellow-400/30 rounded-2xl"
                          />
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-yellow-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-yellow-500/30">Được Bảo Vệ</span>
                        </div>
                      )}

                      {/* Doctor (Bác Sĩ) - Teal glowing medical cross and pulsing aura */}
                      {myRole?.slug === 'doctor' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-cyan-500/10 border-2 border-cyan-400/80 rounded-2xl shadow-[inset_0_0_20px_rgba(6,182,212,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                          >
                            💊
                          </motion.div>
                          {/* Floating small crosses */}
                          {[...Array(3)].map((_, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ y: 20, x: (idx - 1) * 15, opacity: 0 }}
                              animate={{ y: -30, opacity: [0, 1, 0] }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: idx * 0.4 }}
                              className="absolute text-[10px] text-cyan-400 font-extrabold"
                            >
                              ➕
                            </motion.span>
                          ))}
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-cyan-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">Cấp Cứu</span>
                        </div>
                      )}

                      {/* Seer (Tiên Tri) - Cosmic violet crystal ball and stardust */}
                      {myRole?.slug === 'seer' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-purple-500/10 border-2 border-purple-400/80 rounded-2xl shadow-[inset_0_0_20px_rgba(139,92,246,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                            className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.15)_0%,transparent_70%)]"
                          />
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1], y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                            className="text-4xl filter drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                          >
                            🔮
                          </motion.div>
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-purple-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-purple-500/30">Đang Soi</span>
                        </div>
                      )}

                      {/* Wolf Seer (Sói Tiên Tri) - Dark crimson crystal ball with claw markings */}
                      {myRole?.slug === 'wolf_seer' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-red-950/20 border-2 border-red-700/80 rounded-2xl shadow-[inset_0_0_20px_rgba(220,38,38,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="text-4xl filter drop-shadow-[0_0_15px_rgba(220,38,38,0.9)]"
                          >
                            🔮🐺
                          </motion.div>
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-red-500 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-red-700/30">Sói Soi</span>
                        </div>
                      )}

                      {/* Witch Healing (Phù Thủy - Cứu) - Green elixir pouring bubbles */}
                      {myRole?.slug === 'witch' && activeSkillType === 'witch_heal' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-emerald-500/10 border-2 border-emerald-400/80 rounded-2xl shadow-[inset_0_0_20px_rgba(16,185,129,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ rotate: [-20, -10, -20], y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                          >
                            🧪
                          </motion.div>
                          {/* Rising green bubbles */}
                          {[...Array(3)].map((_, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ y: 20, x: (idx - 1) * 12, opacity: 0 }}
                              animate={{ y: -30, opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
                              transition={{ repeat: Infinity, duration: 1.2, delay: idx * 0.3 }}
                              className="absolute text-[8px] text-emerald-400"
                            >
                              🟢
                            </motion.span>
                          ))}
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-emerald-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">Bình Cứu</span>
                        </div>
                      )}

                      {/* Witch Poison (Phù Thủy - Độc) - Skull purple gas dripping drops */}
                      {myRole?.slug === 'witch' && activeSkillType === 'witch_poison' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-purple-500/10 border-2 border-purple-500/80 rounded-2xl shadow-[inset_0_0_20px_rgba(168,85,247,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ rotate: [20, 10, 20], y: [0, 3, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]"
                          >
                            🧪☠️
                          </motion.div>
                          {/* Dripping purple dots */}
                          {[...Array(3)].map((_, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ y: -20, x: (idx - 1) * 10, opacity: 0 }}
                              animate={{ y: 30, opacity: [0, 1, 0] }}
                              transition={{ repeat: Infinity, duration: 1.3, delay: idx * 0.4 }}
                              className="absolute text-[8px] text-purple-400"
                            >
                              💧
                            </motion.span>
                          ))}
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-purple-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-purple-500/30">Độc Dược</span>
                        </div>
                      )}

                      {/* Hunter (Thợ Săn) - Bow & Arrow aiming sight */}
                      {(myRole?.slug === 'hunter' || phase === 'hunter_revenge') && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-orange-500/10 border-2 border-orange-500/80 rounded-2xl shadow-[inset_0_0_20px_rgba(249,115,22,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ scale: [0.95, 1.05, 0.95] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                          >
                            🏹
                          </motion.div>
                          {/* Sniper sight reticle overlay */}
                          <div className="absolute w-16 h-16 border-2 border-dashed border-red-500/40 rounded-full animate-spin" style={{ animationDuration: '6s' }} />
                          <div className="absolute w-2 h-2 bg-red-600 rounded-full animate-ping" />
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-orange-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-orange-500/30">Ngắm Bắn</span>
                        </div>
                      )}

                      {/* Arsonist Douse (Hỏa Tặc - Đổ dầu) - Glossy oil drum dripping dark drops */}
                      {myRole?.slug === 'arsonist' && activeSkillType === 'arsonist_douse' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-800/40 border-2 border-amber-600/80 rounded-2xl shadow-[inset_0_0_20px_rgba(217,119,6,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ y: [0, -4, 0], rotate: [-10, 10, -10] }}
                            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(217,119,6,0.8)]"
                          >
                            🛢️
                          </motion.div>
                          {/* Black oil droplets */}
                          {[...Array(4)].map((_, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ y: -10, x: (idx - 1.5) * 8, opacity: 0 }}
                              animate={{ y: 25, opacity: [0, 1, 0] }}
                              transition={{ repeat: Infinity, duration: 1.2, delay: idx * 0.25 }}
                              className="absolute text-[8px] text-amber-900 font-extrabold"
                            >
                              💧
                            </motion.span>
                          ))}
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-amber-500 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-amber-600/30">Tẩm Dầu</span>
                        </div>
                      )}

                      {/* Arsonist Ignite (Hỏa Tặc - Châm lửa) - Burning bright flames on doused targets */}
                      {showArsonistFire && (
                        <div className="absolute inset-0 bg-red-950/20 border-2 border-red-500 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.6)] overflow-hidden">
                          {/* Row of fires at the bottom */}
                          <div className="absolute inset-x-0 bottom-0 flex justify-around pointer-events-none">
                            {[...Array(6)].map((_, idx) => (
                              <motion.span
                                key={idx}
                                animate={{ y: [0, -10, 0], scale: [1, 1.3, 0.9], opacity: [0.8, 1, 0.7] }}
                                transition={{ repeat: Infinity, duration: 0.6 + idx * 0.1, ease: "linear" }}
                                className="text-3xl filter drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                              >
                                🔥
                              </motion.span>
                            ))}
                          </div>
                          {/* Rising hot amber particles */}
                          {[...Array(5)].map((_, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ y: 35, x: (idx - 2) * 18, scale: 0.5, opacity: 0 }}
                              animate={{ y: -45, scale: [0.5, 1.2, 0.3], opacity: [0, 1, 0] }}
                              transition={{ repeat: Infinity, duration: 1 + idx * 0.2, ease: "easeOut" }}
                              className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_8px_#f59e0b]"
                            />
                          ))}
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-red-500 tracking-widest bg-slate-950/90 border border-red-600 px-3 py-1 rounded-lg animate-pulse shadow-lg shadow-red-900/50">HỎA HOẠN 🔥</span>
                        </div>
                      )}

                      {/* Werewolf / Alpha Wolf (Ma Sói) - Crimson slashing claws and blood splash */}
                      {(myRole?.team === 'werewolf' && myRole?.slug !== 'wolf_seer') && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-rose-950/20 border-2 border-rose-600/80 rounded-2xl shadow-[inset_0_0_20px_rgba(225,29,72,0.4)] overflow-hidden">
                          {/* Animated claw slashing marks */}
                          <motion.div 
                            initial={{ scale: 0.2, rotate: -45, opacity: 0 }}
                            animate={{ scale: [0.2, 1.2, 1], rotate: [-45, 0, -10], opacity: [0, 1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                            className="text-5xl filter drop-shadow-[0_0_15px_rgba(225,29,72,1)]"
                          >
                            🐺🩸
                          </motion.div>
                          {/* Slash lines */}
                          <motion.div
                            animate={{ width: ['0%', '120%'], opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute h-1 bg-red-600 shadow-[0_0_10px_#ef4444] rotate-12"
                          />
                          <motion.div
                            animate={{ width: ['0%', '120%'], opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                            className="absolute h-1 bg-red-600 shadow-[0_0_10px_#ef4444] -rotate-12"
                          />
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-rose-500 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-rose-600/30">Mục Tiêu Cắn</span>
                        </div>
                      )}

                      {/* Detective (Thám Tử) - Neon scanlines and magnifying glass scanner */}
                      {myRole?.slug === 'detective' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-teal-500/10 border-2 border-teal-400/80 rounded-2xl shadow-[inset_0_0_20px_rgba(20,184,166,0.3)] overflow-hidden">
                          {/* Moving horizontal green scanline */}
                          <motion.div
                            animate={{ y: [-40, 40] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatType: "reverse" }}
                            className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_8px_#14b8a6]"
                          />
                          <motion.div 
                            animate={{ y: [0, -3, 0], scale: [1, 1.08, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(20,184,166,0.8)]"
                          >
                            🔍
                          </motion.div>
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-teal-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-teal-500/30">Điều Tra</span>
                        </div>
                      )}

                      {/* Jailer (Cai Ngục) - Heavy slide-down iron dungeon bars */}
                      {showJailerEffect && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-blue-900/10 border-2 border-blue-500/80 rounded-2xl shadow-[inset_0_0_20px_rgba(59,130,246,0.3)] overflow-hidden">
                          {/* Vertical jail bars dropping down */}
                          <div className="absolute inset-0 flex justify-around px-2 pointer-events-none">
                            {[...Array(5)].map((_, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ y: -100 }}
                                animate={{ y: 0 }}
                                transition={{ type: "spring", damping: 12, stiffness: 100, delay: idx * 0.08 }}
                                className="w-1.5 h-full bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 border-x border-black/40 shadow-md"
                              />
                            ))}
                          </div>
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-blue-300 tracking-widest bg-slate-950/90 border border-blue-500/40 px-3 py-1.5 rounded-lg z-30 shadow-lg animate-pulse">GIAM CẦM ⛓️</span>
                        </div>
                      )}

                      {/* Gunner (Xạ Thủ) - Revolver locking crosshair and bullet recoil */}
                      {myRole?.slug === 'gunner' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-yellow-500/5 border-2 border-yellow-500/80 rounded-2xl shadow-[inset_0_0_20px_rgba(234,179,8,0.2)] overflow-hidden">
                          <motion.div 
                            animate={{ rotate: [-5, 5, -5], scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]"
                          >
                            🔫
                          </motion.div>
                          {/* Pulsing reticle */}
                          <motion.div
                            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 0.8, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute w-12 h-12 border border-red-500 rounded-full"
                          />
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-yellow-500 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-yellow-500/30">Mục Tiêu Bắn</span>
                        </div>
                      )}

                      {/* Cupid (Thần Tình Yêu) - Throbbing pink hearts floating */}
                      {myRole?.slug === 'cupid' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-pink-500/10 border-2 border-pink-400/80 rounded-2xl shadow-[inset_0_0_20px_rgba(236,72,153,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ scale: [1, 1.25, 1] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                            className="text-4xl filter drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]"
                          >
                            💘
                          </motion.div>
                          {/* Floating mini hearts */}
                          {[...Array(4)].map((_, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ y: 20, x: (idx - 1.5) * 14, opacity: 0 }}
                              animate={{ y: -30, opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6] }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: idx * 0.35 }}
                              className="absolute text-xs"
                            >
                              💖
                            </motion.span>
                          ))}
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-pink-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-pink-500/30">Ghép Đôi</span>
                        </div>
                      )}

                      {/* Serial Killer (Sát Nhân) - Blood dripping knife slash */}
                      {myRole?.slug === 'serial_killer' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-purple-950/20 border-2 border-purple-600/80 rounded-2xl shadow-[inset_0_0_20px_rgba(147,51,234,0.4)] overflow-hidden">
                          <motion.div 
                            animate={{ rotate: [-20, 20, -20], scale: [1, 1.12, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(147,51,234,0.9)]"
                          >
                            🔪
                          </motion.div>
                          {/* Blood splashes */}
                          {[...Array(4)].map((_, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ y: -10, x: (idx - 1.5) * 12, opacity: 0 }}
                              animate={{ y: 25, opacity: [0, 1, 0], scale: [1, 0.5, 0.1] }}
                              transition={{ repeat: Infinity, duration: 1.1, delay: idx * 0.25 }}
                              className="absolute w-2 h-2 bg-red-600 rounded-full"
                            />
                          ))}
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-purple-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-purple-600/30">Mục Tiêu Giết</span>
                        </div>
                      )}

                      {/* Headhunter (Săn Đầu Người) - Red target sniper lock-on */}
                      {myRole?.slug === 'headhunter' && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-orange-950/20 border-2 border-orange-500/80 rounded-2xl shadow-[inset_0_0_20px_rgba(249,115,22,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ repeat: Infinity, duration: 1.4 }}
                            className="text-4xl filter drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                          >
                            🎯
                          </motion.div>
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-orange-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-orange-500/30">MỤC TIÊU 🎯</span>
                        </div>
                      )}

                      {/* Medium (Ngoại Cảm) - Glowing blue ghost spirits floating */}
                      {myRole?.slug === 'medium' && !p.isAlive && isSelected && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-blue-900/10 border-2 border-blue-400/80 rounded-2xl shadow-[inset_0_0_20px_rgba(96,165,250,0.3)] overflow-hidden">
                          <motion.div 
                            animate={{ y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="text-4xl filter drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]"
                          >
                            💀👻
                          </motion.div>
                          {/* Floating wisps */}
                          {[...Array(3)].map((_, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ y: 25, x: (idx - 1) * 15, scale: 0.5, opacity: 0 }}
                              animate={{ y: -35, opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.4] }}
                              transition={{ repeat: Infinity, duration: 1.6, delay: idx * 0.4, ease: "easeOut" }}
                              className="absolute w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa] blur-[0.5px]"
                            />
                          ))}
                          <span className="absolute bottom-1 text-[8px] font-black uppercase text-blue-400 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-blue-500/30">Gọi Hồn</span>
                        </div>
                      )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dynamic speech bubble element */}
                <AnimatePresence>
                  {hasBubble && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-full bg-white text-slate-800 text-[10px] px-2.5 py-1.5 rounded-xl shadow-2xl border border-slate-100 z-30 max-w-[90%] font-semibold"
                    >
                      <p className="truncate max-w-[120px]">{hasBubble.text}</p>
                      <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-slate-100"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Floating action buttons at the bottom center of the player grid (as in Image 2 & 3) */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-40">
          
          {/* Witch / Arsonist / Active Skills during Night */}
          {phase === 'night' && nightPrompt?.actions && !isJailedAtNight ? (
             <div className="flex gap-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/50 shadow-2xl">
                {nightPrompt.actions.map(a => (
                   <button key={a.type}
                     onClick={() => {
                        setActiveSkillType(a.type);
                        setSelectedTargets([]);
                        if (a.targets.length === 0) {
                           nightAction(a.type, null);
                           setActionSent(true);
                           toast.success('Đã chọn ' + a.label, { icon: '✅' });
                        }
                     }}
                     className={`w-14 h-14 rounded-full border-2 text-2xl flex items-center justify-center transition-all shadow-lg ${
                       activeSkillType === a.type 
                         ? 'bg-indigo-600 border-indigo-400 scale-110 shadow-indigo-500/50' 
                         : 'bg-slate-800 border-slate-600 hover:scale-105 hover:bg-slate-700 text-slate-400'
                     }`}
                     title={a.label}
                   >
                     {a.type.includes('heal') ? '💊' : a.type.includes('poison') ? '☠️' : a.type.includes('skip') ? '⏭️' : a.type.includes('douse') ? '🛢️' : a.type.includes('ignite') ? '🔥' : a.type.includes('check') ? '🔮' : a.type.includes('transform') ? '🐺' : '✨'}
                   </button>
                ))}

                {/* Multi-target Confirmation Button inside the same bar */}
                {isMultiTargetAction && selectedTargets.length >= (activeSkillType === 'arsonist_douse' ? 1 : 2) && !actionSent && (
                  <button
                    onClick={() => {
                      const targetIdsString = selectedTargets.join(',');
                      let currentActionType = activeSkillType || nightPrompt.actionType;
                      nightAction(currentActionType, targetIdsString);
                      setActionSent(true);
                      toast.success('Đã gửi hành động lựa chọn!', { icon: '✅' });
                    }}
                    className="px-5 rounded-full bg-emerald-600 border border-emerald-400 font-extrabold text-[10px] uppercase tracking-wider hover:bg-emerald-500 hover:scale-105 transition-all text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"
                  >
                    Confirm ({selectedTargets.length})
                  </button>
                )}
             </div>
          ) : (phase === 'discuss' || phase === 'vote') && myRole?.slug === 'mayor' && isAlive && !roleData?.revealed ? (
             <div className="flex gap-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/50 shadow-2xl">
              <button 
                onClick={() => {
                  useSocketStore.getState().mayorReveal();
                  toast.success('Đã lật bài Thị Trưởng!', { icon: '👑' })
                }}
                className="w-14 h-14 rounded-full bg-yellow-600 border-2 border-yellow-400 text-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all shadow-yellow-500/30"
                title="Lật bài Thị Trưởng (Phiếu bầu x2)"
              >
                👑
              </button>
             </div>
          ) : (phase === 'discuss' || phase === 'vote') && myRole?.slug === 'jailer' && isAlive ? (
             <div className="flex gap-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/50 shadow-2xl">
              <button 
                onClick={() => {
                  setShowJailerPrompt(true);
                }}
                className="w-14 h-14 rounded-full bg-blue-600 border-2 border-blue-400 text-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all shadow-blue-500/30"
                title="Giam giữ một người cho đêm nay"
              >
                ⛓️
              </button>
             </div>
          ) : (phase === 'discuss' || phase === 'vote') && myRole?.slug === 'gunner' && isAlive ? (
             <div className="flex gap-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/50 shadow-2xl">
              <button 
                onClick={() => {
                  if ((roleData?.bullets || 0) <= 0) {
                    toast.error('Bạn đã hết đạn bạc!', { icon: '⚠️' });
                  } else if (roleData?.lastShotRound === round) {
                    toast.error('Mỗi ngày chỉ được bắn tối đa 1 lần. Hãy đợi đến ngày mai!', { icon: '⚠️' });
                  } else {
                    setShowGunnerPromptLocal(true);
                  }
                }}
                className="w-14 h-14 rounded-full bg-yellow-600 border-2 border-yellow-400 text-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all shadow-yellow-500/30"
                title={`Bắn hạ kẻ tình nghi (Còn ${roleData?.bullets ?? 2} viên)`}
              >
                🔫
              </button>
             </div>
          ) : phase === 'night' && isMultiTargetAction && selectedTargets.length >= 2 && !actionSent && !isJailedAtNight ? (
             /* For roles that don't have multiple skill buttons, like Cupid or Detective */
             <div className="flex gap-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/50 shadow-2xl">
               <button
                 onClick={() => {
                   const targetIdsString = selectedTargets.join(',');
                   let currentActionType = activeSkillType || nightPrompt?.actionType;
                   nightAction(currentActionType, targetIdsString);
                   setActionSent(true);
                   toast.success('Đã gửi hành động lựa chọn!', { icon: '✅' });
                 }}
                 className="px-6 h-14 rounded-full bg-emerald-600 border border-emerald-400 font-extrabold text-xs uppercase tracking-wider hover:bg-emerald-500 hover:scale-105 transition-all text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"
               >
                 ✅ Xác nhận chọn ({selectedTargets.length})
               </button>
             </div>
          ) : (
            <>
              {/* Action button 1: Gamepad / options */}
              <button className="w-12 h-12 rounded-full bg-[#1b2332]/95 border border-slate-700/80 text-lg flex items-center justify-center hover:scale-105 active:scale-95 hover:border-slate-500 transition-all text-indigo-400 shadow-md shadow-black/30">
                🎮
              </button>
              {/* Action button 2: Skip voting (Rose) */}
              <button 
                onClick={() => {
                  if (phase === 'vote' && isAlive && !actionSent) {
                    handleVote('skip')
                  } else {
                    toast('Bạn đã bỏ phiếu trắng!')
                  }
                }}
                className="w-14 h-14 rounded-full bg-slate-900 border-2 border-indigo-500 text-xl flex items-center justify-center hover:scale-105 active:scale-95 hover:border-indigo-400 transition-all text-pink-500 shadow-lg shadow-indigo-500/20"
              >
                🌹
              </button>
            </>
          )}
        </div>

        {/* HUNTER ACTION BANNER */}
        <AnimatePresence>
          {hunterPrompt && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 bg-amber-950/90 border-2 border-amber-500/30 rounded-2xl p-4 text-center max-w-sm shadow-2xl backdrop-blur-sm">
              <h3 className="text-xs font-bold text-amber-300 mb-2">🏹 {hunterPrompt.message}</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {hunterPrompt.targets?.map(t => (
                  <button key={t.userId} onClick={() => handleHunterShot(t.userId)}
                    className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                      selectedTarget === t.userId 
                        ? 'bg-amber-500 text-white border-amber-400' 
                        : 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border-amber-500/20'
                    }`}>
                    #{t.seatNumber} {t.username}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GUNNER SHOT BANNER (ACTIVE SKILL) */}
        <AnimatePresence>
          {showGunnerPromptLocal && (phase === 'discuss' || phase === 'vote') && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-32 left-1/2 transform -translate-x-1/2 z-40 bg-yellow-950/95 border-2 border-yellow-500/40 rounded-2xl p-4 text-center max-w-md shadow-2xl backdrop-blur-sm">
              <h3 className="text-xs font-bold text-yellow-300 mb-1">🔫 Xạ Thủ: Chọn mục tiêu để bắn hạ</h3>
              <p className="text-[10px] text-yellow-400/60 mb-2">Còn {roleData?.bullets ?? 2} viên đạn</p>
              <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto p-1">
                {players.filter(p => p.isAlive && p.userId !== user?.id).map(t => (
                  <button key={t.userId} onClick={() => {
                    socket?.emit('game:gunner_shot', { target_id: t.userId })
                    setShowGunnerPromptLocal(false)
                  }}
                    className="px-2.5 py-1 rounded bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-200 text-xs font-bold border border-yellow-500/20 transition-all hover:scale-105">
                    #{t.seatNumber} {t.username}
                  </button>
                ))}
                <button onClick={() => setShowGunnerPromptLocal(false)}
                  className="px-2.5 py-1 rounded bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 text-xs font-bold border border-slate-500/20 transition-all">
                  Đóng
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* JAILER DAY JAIL BANNER */}
        <AnimatePresence>
          {showJailerPrompt && (phase === 'discuss' || phase === 'vote') && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-32 left-1/2 transform -translate-x-1/2 z-40 bg-blue-950/95 border-2 border-blue-500/40 rounded-2xl p-4 text-center max-w-md shadow-2xl backdrop-blur-sm">
              <h3 className="text-xs font-bold text-blue-300 mb-2">⛓️ Cai Ngục: Chọn một người để giam giữ đêm nay</h3>
              <p className="text-[10px] text-blue-400/70 mb-3">Người bị giam sẽ bị khóa mọi hành động ban đêm.</p>
              <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto p-1">
                {players.filter(p => p.isAlive && p.userId !== user?.id && p.userId !== roleData?.lastJailed).map(t => (
                  <button key={t.userId} onClick={() => {
                    socket?.emit('game:jailer_jail', { target_id: t.userId })
                    setShowJailerPrompt(false)
                  }}
                    className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-bold border border-blue-500/20 transition-all hover:scale-105">
                    #{t.seatNumber} {t.username}
                  </button>
                ))}
                <button onClick={() => setShowJailerPrompt(false)}
                  className="px-2.5 py-1 rounded bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 text-xs font-bold border border-slate-500/20 transition-all">
                  Đóng
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* PHASE TRANSITION BANNER */}
        <AnimatePresence>
          {phaseTransition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, ${phaseTransition.color}30 0%, transparent 70%)` }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.2, opacity: 0, y: -20 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-7xl mb-4 filter drop-shadow-2xl"
                >
                  {phaseTransition.emoji}
                </motion.div>
                <h2
                  className="text-4xl font-black tracking-wider uppercase"
                  style={{
                    color: phaseTransition.color,
                    textShadow: `0 0 40px ${phaseTransition.color}80, 0 0 80px ${phaseTransition.color}40`,
                  }}
                >
                  {phaseTransition.text}
                </h2>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GAME RESULTS OVERLAY */}
        <AnimatePresence>
          {gameResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-[#1e2637] border-2 border-slate-800 rounded-3xl p-8 max-w-2xl w-full text-center shadow-2xl space-y-6">
                <div className="text-5xl">{gameResult.winningTeam === 'village' ? '🏘️' : gameResult.winningTeam === 'werewolf' ? '🐺' : gameResult.winningTeam === 'draw' ? '⚖️' : '🃏'}</div>
                <div>
                  <h2 className="text-2xl font-black tracking-wide" style={{ color: TEAM_COLORS[gameResult.winningTeam] }}>
                    {gameResult.reason}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 uppercase font-black tracking-widest">
                    Phe thắng: {gameResult.winningTeam === 'village' ? 'Dân Làng' : gameResult.winningTeam === 'werewolf' ? 'Bầy Sói' : gameResult.winningTeam === 'draw' ? 'Hòa Nhau' : 'Độc Lập'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left max-h-60 overflow-y-auto p-2 border border-slate-800/80 rounded-2xl bg-black/15">
                  {roleReveal.map(r => (
                    <div key={r.userId} className={`flex items-center gap-2 p-2.5 rounded-xl text-xs bg-slate-900/50 ${r.isAlive ? 'border border-slate-800' : 'opacity-50 grayscale'}`}>
                      <span>{ROLE_DETAILS[r.roleSlug]?.icon || '❓'}</span>
                      <div>
                        <div className="font-extrabold text-white truncate max-w-[100px]">{r.username}</div>
                        <div className="text-[10px] font-black" style={{ color: ROLE_DETAILS[r.roleSlug]?.color }}>
                          {ROLE_DETAILS[r.roleSlug]?.vi || r.roleSlug}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-600/25">
                  Quay Lại Sảnh Chờ
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  )
}
