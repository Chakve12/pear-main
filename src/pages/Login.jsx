import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import { signIn } from '../services/firebaseAuth'
import { isConfigured } from '../services/firebaseConfig'
import { useUserStore } from '../store/useUserStore'
import brandBg from '../assets/pear-brand.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser, triggerSplash } = useUserStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isConfigured) {
      /* local mode works without firebase config */
    }
    setLoading(true)
    try {
      const profile = await signIn(email, password)
      setUser(profile, profile.role, profile.modelId)
      triggerSplash()
      toast.success(`კეთილი იყოს დაბრუნება${profile.displayName ? `, ${profile.displayName}` : ''}`)
      navigate('/dashboard')
    } catch (err) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'ელფოსტა ან პაროლი არასწორია'
          : err.message || 'შესვლა ვერ მოხერხდა'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex">
      <motion.div className="absolute inset-0" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 12 }}>
        <img src={brandBg} alt="PEAR" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/80" />
      </motion.div>

      <div className="relative z-10 flex flex-col lg:flex-row w-full min-h-screen">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-1 flex-col justify-end p-16 pb-20"
        >
          <p className="text-[#f5f0e8]/50 text-xs uppercase tracking-[0.35em] mb-4">შიდა სისტემა</p>
          <h2 className="text-[#f5f0e8] text-5xl font-light tracking-[0.15em]">PEAR</h2>
          <p className="text-[#f5f0e8]/60 text-lg mt-4 max-w-sm font-light">ელიტური მოდელების მართვის პლატფორმა</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 items-center justify-center p-6 sm:p-10 lg:max-w-xl lg:ml-auto"
        >
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-[#f5f0e8]/10 bg-black/40 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
              <p className="text-[#f5f0e8]/50 text-xs uppercase tracking-[0.25em] mb-3">მოგესალმებით</p>
              <h1 className="text-[#f5f0e8] text-3xl font-light tracking-wide mb-8">შესვლა</h1>

              <form onSubmit={handleSubmit} className="space-y-7">
                <div>
                  <label className="text-[#f5f0e8]/50 text-xs uppercase tracking-widest mb-3 block">ელფოსტა</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="login-input"
                    placeholder="ელფოსტა"
                  />
                </div>
                <div>
                  <label className="text-[#f5f0e8]/50 text-xs uppercase tracking-widest mb-3 block">პაროლი</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="login-input pr-10"
                      placeholder="პაროლი"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#f5f0e8]/40 p-1">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" loading={loading} variant="luxury" className="w-full !py-4 !text-sm !tracking-[0.15em] !uppercase">
                  შესვლა
                </Button>
              </form>

              <p className="mt-8 text-center text-[#f5f0e8]/30 text-xs leading-relaxed">
                წვდომა მხოლოდ მოწვევით
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
