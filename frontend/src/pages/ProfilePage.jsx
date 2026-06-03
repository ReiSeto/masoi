import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore, api } from '../store/authStore'
import { Trophy, Swords, Shield, Star } from 'lucide-react'

export default function ProfilePage() {
  const { username } = useParams()
  const { user: currentUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const targetUsername = username || currentUser?.username

  useEffect(() => {
    if (targetUsername) {
      api.get(`/users/${targetUsername}`)
        .then(({ data }) => setProfile(data.data.user))
        .catch(() => setProfile(null))
        .finally(() => setLoading(false))
    }
  }, [targetUsername])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0812, #1a0e14, #12101e)' }}>
      <div className="text-center">
        <div className="vn-loader mx-auto mb-4" />
        <p className="text-vn-gold-400/60 text-sm">Đang tải...</p>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0812, #1a0e14, #12101e)' }}>
      <div className="text-center">
        <div className="text-6xl mb-4">🪷</div>
        <p className="text-gray-400">Không tìm thấy người dùng</p>
        <Link to="/" className="btn-primary inline-block mt-4 text-sm">← Về Trang Chủ</Link>
      </div>
    </div>
  )

  const winRate = profile.games_played > 0
    ? Math.round((profile.games_won / profile.games_played) * 100)
    : 0

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(180deg, #0a0812, #1a0e14, #12101e)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-vn-gold-400/60 hover:text-vn-gold-400 text-sm font-bold mb-6 transition-colors">
          ← Quay lại
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 mb-6 relative overflow-hidden">
          {/* Gold top border */}
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,179,0,0.5), rgba(229,57,53,0.3), rgba(255,179,0,0.5), transparent)' }} />
          
          <div className="flex items-center gap-6">
            <div className="avatar w-20 h-20 text-3xl">
              {profile.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">{profile.username}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Star size={14} className="text-vn-gold-400" />
                <span className="text-vn-gold-400 font-semibold">Level {profile.level}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-sm">🇻🇳 {profile.country_code || 'VN'}</span>
              </div>
              {profile.bio && <p className="text-gray-400 text-sm mt-2">{profile.bio}</p>}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Swords size={20} />, label: 'Ván Đã Chơi', value: profile.games_played || 0, color: 'text-vn-jade-400' },
            { icon: <Trophy size={20} />, label: 'Ván Thắng', value: profile.games_won || 0, color: 'text-vn-gold-400' },
            { icon: <Shield size={20} />, label: 'Tỷ Lệ Thắng', value: `${winRate}%`, color: 'text-vn-red-400' },
            { icon: <Star size={20} />, label: 'ELO', value: profile.stats?.elo_rating || 1000, color: 'text-wolf-300' },
          ].map((stat) => (
            <motion.div key={stat.label} whileHover={{ y: -3 }} className="card p-4 text-center relative overflow-hidden">
              <div className={`${stat.color} flex justify-center mb-2`}>{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
