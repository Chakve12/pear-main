import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Shield, Sparkles, User } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import AvatarPicker from '../components/ui/AvatarPicker'
import { changeUserAvatar } from '../services/avatarService'
import { useUserStore } from '../store/useUserStore'
import { isAdminRole, roleLabel } from '../utils/roles'

export default function Profile() {
  const { user, role, modelId, userAvatar } = useUserStore()

  if (!user) return <Navigate to="/login" replace />

  if (role === 'model' && modelId) {
    return <Navigate to={`/models/${modelId}`} replace />
  }

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">
              <User size={32} strokeWidth={1.5} />
              ჩემი პროფილი
            </h1>
            <p className="text-[var(--text-muted)] mt-2 text-lg">პროფილის ფოტო და ინფორმაცია</p>
          </div>
        </FadeInItem>

        <FadeInItem>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden border max-w-2xl"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--hero-gradient)' }}
          >
            <div className="absolute inset-0 opacity-30" style={{ background: 'var(--accent-soft)' }} />
            <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <AvatarPicker
                src={userAvatar}
                name={user.displayName || user.email}
                size="lg"
                animate
                editable
                onUpload={(file) => changeUserAvatar(user.uid, file)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[var(--accent)] text-xs uppercase tracking-widest mb-2">
                  <Sparkles size={12} />
                  {isAdminRole(role) ? roleLabel(role) : 'მომხმარებელი'}
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {user.displayName || user.email}
                </h2>
                {isAdminRole(role) && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium mt-2"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    <Shield size={10} />
                    {roleLabel(role)}
                  </span>
                )}
                {user.email && (
                  <p className="flex items-center gap-1.5 text-sm text-[var(--text-subtle)] mt-3">
                    <Mail size={14} />
                    {user.email}
                  </p>
                )}
                <p className="text-sm text-[var(--text-muted)] mt-4">
                  პროფილის ფოტოს შეცვლა შეგიძლია აქ — დააჭირე ფოტოს.
                </p>
              </div>
            </div>
          </motion.div>
        </FadeInItem>
      </FadeInContainer>
    </PageTransition>
  )
}
