import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Star, Image, ArrowRight } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import ModelAvatar from '../components/ui/ModelAvatar'
import { SkeletonCard } from '../components/ui/Loader'
import { buildLeaderboard, useUserStore } from '../store/useUserStore'
import { getModelImages } from '../services/storage'

export default function ModelsOverview() {
  const navigate = useNavigate()
  const { points, models } = useUserStore()
  const leaderboard = useMemo(() => buildLeaderboard(models, points), [models, points])
  const [uploadCounts, setUploadCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const counts = {}
      await Promise.all(
        models.map(async (m) => {
          const imgs = await getModelImages(m.id, 'uploaded')
          counts[m.id] = imgs.length
        })
      )
      setUploadCounts(counts)
      setLoading(false)
    }
    load()
  }, [models])

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)]">მოდელები</h1>
            <p className="text-[var(--text-muted)] mt-2 text-lg">ყველა მოდელის პროფილი და სტატისტიკა</p>
          </div>
        </FadeInItem>

        {models.length === 0 ? (
          <Card hover={false} className="text-center py-16">
            <Users className="mx-auto text-[var(--text-subtle)] mb-3" size={32} />
            <p className="text-[var(--text-muted)]">მოდელები ჯერ არ არის. შექმენი ადმინ პანელიდან.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => {
              const modelPoints = points[model.id] || 0
              const uploads = uploadCounts[model.id] ?? 0
              const rank = leaderboard.findIndex((m) => m.id === model.id) + 1

              return (
                <FadeInItem key={model.id}>
                  {loading ? (
                    <SkeletonCard className="h-56 rounded-2xl" />
                  ) : (
                    <Card onClick={() => navigate(`/models/${model.id}`)} glow>
                      <div className="flex items-start justify-between mb-4">
                        <ModelAvatar src={model.avatar} name={model.name} size="md" />
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-[var(--text-muted)]" style={{ background: 'var(--bg-hover)' }}>#{rank}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--text-primary)]">{model.name}</h3>
                      <p className="text-sm text-[var(--text-muted)] mt-1">{model.tagline}</p>
                      <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="p-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                          <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs mb-1"><Star size={12} />ქულები</div>
                          <p className="text-lg font-semibold text-[var(--text-primary)]">{modelPoints}</p>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                          <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs mb-1"><Image size={12} />ატვირთვები</div>
                          <p className="text-lg font-semibold text-[var(--text-primary)]">{uploads}</p>
                        </div>
                      </div>
                      <motion.div className="flex items-center gap-2 mt-5 text-sm text-[var(--accent)]" whileHover={{ x: 4 }}>
                        პროფილის ნახვა <ArrowRight size={16} />
                      </motion.div>
                    </Card>
                  )}
                </FadeInItem>
              )
            })}
          </div>
        )}
      </FadeInContainer>
    </PageTransition>
  )
}
