import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-wolf-gradient">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="text-9xl mb-6">🐺</div>
        <h1 className="text-6xl font-black text-gradient mb-4">404</h1>
        <p className="text-gray-400 text-xl mb-8">Trang không tồn tại hoặc Sói đã ăn nó rồi!</p>
        <Link to="/" className="btn-primary inline-block">Về Trang Chủ</Link>
      </motion.div>
    </div>
  )
}
