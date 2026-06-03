import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a0812, #1a0e14, #12101e)' }}>
      {/* Subtle glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(229,57,53,0.08), rgba(255,179,0,0.04), transparent)' }} />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative z-10">
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-8xl mb-6 filter drop-shadow-[0_0_30px_rgba(229,57,53,0.3)]"
        >
          🐺
        </motion.div>
        <h1 className="text-7xl font-black text-gradient mb-4">404</h1>
        <p className="text-vn-gold-400/60 text-xl mb-2">Trang không tồn tại</p>
        <p className="text-gray-500 text-sm mb-8">...hoặc Sói đã ăn nó rồi! 🌙</p>
        <Link to="/" className="btn-primary inline-block">
          🏮 Về Trang Chủ
        </Link>
      </motion.div>
    </div>
  )
}
