import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Mật khẩu xác nhận không khớp')
    if (form.password.length < 6) return toast.error('Mật khẩu ít nhất 6 ký tự')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-wolf-gradient" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-wolf-600/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🐺</div>
          <h1 className="text-3xl font-bold text-gradient">Wolvesville VN</h1>
          <p className="text-gray-400 mt-2">Tạo tài khoản miễn phí</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-white mb-6">Đăng Ký</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tên Người Dùng</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input id="reg-username" name="username" type="text" value={form.username} onChange={handleChange}
                  className="input-field pl-10" placeholder="wolf_hunter_vn" required minLength={3} maxLength={30}
                  pattern="[a-zA-Z0-9_]+" title="Chỉ dùng chữ, số và dấu gạch dưới" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input id="reg-email" name="email" type="email" value={form.email} onChange={handleChange}
                  className="input-field pl-10" placeholder="your@email.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mật Khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input id="reg-password" name="password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  className="input-field pl-10 pr-10" placeholder="Ít nhất 6 ký tự" required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Xác Nhận Mật Khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input id="reg-confirm" name="confirm" type="password" value={form.confirm} onChange={handleChange}
                  className="input-field pl-10" placeholder="Nhập lại mật khẩu" required />
              </div>
            </div>

            <motion.button id="reg-submit" type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
              className="btn-primary w-full mt-6">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo tài khoản...
                </span>
              ) : 'Tạo Tài Khoản Miễn Phí 🐺'}
            </motion.button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-dark-600" />
            <span className="text-gray-500 text-sm">hoặc</span>
            <div className="flex-1 h-px bg-dark-600" />
          </div>

          <p className="text-center text-gray-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-wolf-300 hover:text-wolf-200 font-semibold transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
