import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Upload, Megaphone, Trophy, MessageCircle, ArrowRight, Sparkles } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import ModelAvatar from '../components/ui/ModelAvatar'
import ThemeToggle from '../components/ui/ThemeToggle'
import { useUserStore } from '../store/useUserStore'
import { isAdminRole } from '../utils/roles'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, role, modelId, getLeaderboard, announcements, getModels } = useUserStore()
  const leaderboard = getLeaderboard()
  const models = getModels()

  const uploadsRoute = isAdminRole(role) ? '/uploads' : modelId ? `/models/${modelId}` : '/dashboard'

  const dashboardCards = [
    { title: 'მოდელები', description: `${models.length} მოდელი`, icon: Users, to: '/models' },
    { title: 'ატვირთვები', description: isAdminRole(role) ? 'ყველა ფოტო' : 'შენი გალერეა', icon: Upload, to: uploadsRoute },
    { title: 'განცხადებები', description: 'სიახლეები', icon: Megaphone, to: '/announcements' },
    { title: 'ლიდერბორდი', description: 'რეიტინგი', icon: Trophy, to: '/leaderboard' },
    { title: 'ჩატი', description: 'საერთო სივრცე', icon: MessageCircle, to: '/chat' },
  ]

  const firstName = user?.displayName?.split(/[\s"']/)[0] || 'ელიტა'

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[var(--accent)] text-xs uppercase tracking-[0.2em] mb-3"
              >
                <Sparkles size={14} />
                PEAR™ Elite
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
                გამარჯობა, {firstName}
              </h1>
              <p className="text-[var(--text-muted)] mt-2">შენი სამუშაო დაფა</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-muted)] hidden sm:block">თემა</span>
              <ThemeToggle />
            </div>
          </div>
        </FadeInItem>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
          {dashboardCards.map((card, i) => (
            <FadeInItem key={card.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card onClick={() => navigate(card.to)} glow>
                  <card.icon className="text-[var(--accent)]" size={22} strokeWidth={1.5} />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{card.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{card.description}</p>
                  <ArrowRight size={14} className="mt-4 text-[var(--text-subtle)]" />
                </Card>
              </motion.div>
            </FadeInItem>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FadeInItem>
            <Card hover={false}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <Trophy size={18} className="text-[var(--accent)]" />
                ლიდერბორდი
              </h3>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-6 text-center">მოდელები ჯერ არ არის</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((model, i) => (
                    <motion.div
                      key={model.id}
                      whileHover={{ x: 4 }}
                      onClick={() => navigate(`/models/${model.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                    >
                      <span className="w-6 text-center shrink-0">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                      <ModelAvatar src={model.avatar} name={model.name} size="xs" className="!rounded-xl" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{model.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{model.tagline}</p>
                      </div>
                      <span className="text-sm font-semibold text-[var(--accent)]">{model.points} ქ.</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </FadeInItem>

          <FadeInItem>
            <Card hover={false}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <Megaphone size={18} className="text-[var(--accent)]" />
                განცხადებები
              </h3>
              <div className="space-y-2">
                {announcements.slice(0, 3).map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => navigate('/announcements')}
                    className="p-3 rounded-xl cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">{ann.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          </FadeInItem>
        </div>

        {isAdminRole(role) && (
          <FadeInItem>
            <Card className="mt-6" onClick={() => navigate('/admin')}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-[var(--text-primary)]">ადმინ პანელი</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">ანგარიშების და ქულების მართვა</p>
                </div>
                <ArrowRight className="text-[var(--accent)]" />
              </div>
            </Card>
          </FadeInItem>
        )}
      </FadeInContainer>
    </PageTransition>
  )
}
