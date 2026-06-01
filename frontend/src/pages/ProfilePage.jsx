import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
    <div className="min-h-screen bg-wolf-gradient flex items-center justify-center">
      <div className="text-5xl animate-bounce">🐺</div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-wolf-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">😢</div>
        <p className="text-gray-400">Không tìm thấy người dùng</p>
      </div>
    </div>
  )

  const winRate = profile.games_played > 0
    ? Math.round((profile.games_won / profile.games_played) * 100)
    : 0

  return (
    <div className="min-h-screen bg-wolf-gradient py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="avatar w-20 h-20 text-3xl">
              {profile.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">{profile.username}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Star size={14} className="text-gold-400" />
                <span className="text-gold-400 font-semibold">Level {profile.level}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-sm">{profile.country_code || 'VN'}</span>
              </div>
              {profile.bio && <p className="text-gray-400 text-sm mt-2">{profile.bio}</p>}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Swords size={20} />, label: 'Ván Đã Chơi', value: profile.games_played || 0, color: 'text-wolf-400' },
            { icon: <Trophy size={20} />, label: 'Ván Thắng', value: profile.games_won || 0, color: 'text-gold-400' },
            { icon: <Shield size={20} />, label: 'Tỷ Lệ Thắng', value: `${winRate}%`, color: 'text-emerald-400' },
            { icon: <Star size={20} />, label: 'ELO', value: profile.stats?.elo_rating || 1000, color: 'text-wolf-300' },
          ].map((stat) => (
            <motion.div key={stat.label} whileHover={{ y: -3 }} className="card p-4 text-center">
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
