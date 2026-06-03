import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return toast.error('Vui lòng nhập đầy đủ thông tin')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Vietnamese Night Sky Background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #0a0812 0%, #1a0e14 40%, #12101e 70%, #0a0812 100%)'
      }} />
      
      {/* Subtle Vietnamese red-gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(229,57,53,0.08) 0%, rgba(255,179,0,0.04) 50%, transparent 80%)' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(0,150,136,0.06) 0%, transparent 70%)' }} />
      
      {/* Floating Vietnamese decorative elements */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 4 + i * 0.8, delay: i * 0.5 }}
          className="absolute text-2xl pointer-events-none select-none"
          style={{
            top: `${15 + i * 12}%`,
            left: `${10 + (i % 3) * 35}%`,
            filter: 'drop-shadow(0 0 8px rgba(255,179,0,0.3))',
          }}
        >
          {['🪷', '🏮', '✨', '🪷', '🌙', '⭐'][i]}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo with Vietnamese styling */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="mb-4 inline-block relative"
          >
            <span className="text-7xl filter drop-shadow-[0_0_20px_rgba(229,57,53,0.4)]">🐺</span>
            <motion.span 
              animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-3 text-xl"
            >🪷</motion.span>
          </motion.div>
          <h1 className="text-3xl font-black text-gradient tracking-wide" style={{ fontFamily: 'Outfit' }}>
            Ma Sói Việt Nam
          </h1>
          <p className="text-vn-gold-400/60 mt-2 text-sm font-medium tracking-wider">
            ⟡ Game Ma Sói Online ⟡
          </p>
        </div>

        {/* Form Card with Vietnamese gold trim */}
        <div className="card p-8 relative overflow-hidden">
          {/* Top decorative border */}
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,179,0,0.5), rgba(229,57,53,0.3), rgba(255,179,0,0.5), transparent)' }} />
          
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-vn-gold-400">⟐</span> Đăng Nhập
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vn-gold-500/50" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mật Khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vn-gold-500/50" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-vn-gold-400 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              id="login-submit"
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Đăng Nhập <span className="text-vn-gold-300">🐺</span>
                </span>
              )}
            </motion.button>
          </form>

          {/* Vietnamese Ornament Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 vn-divider" />
            <span className="text-vn-gold-500/50 text-sm">⟡</span>
            <div className="flex-1 vn-divider" />
          </div>

          {/* Register link */}
          <p className="text-center text-gray-400">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-vn-gold-400 hover:text-vn-gold-300 font-bold transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
        
        {/* Bottom decorative text */}
        <p className="text-center text-[10px] text-gray-600 mt-4 tracking-widest uppercase">
          Made with 🇻🇳 in Vietnam
        </p>
      </motion.div>
    </div>
  )
}
