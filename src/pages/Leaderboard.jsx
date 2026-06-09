import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Trophy, Star } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import ModelAvatar from '../components/ui/ModelAvatar'
import { buildLeaderboard, useUserStore } from '../store/useUserStore'



const maxPoints = 200



export default function Leaderboard() {

  const navigate = useNavigate()

  const models = useUserStore((s) => s.models)
  const points = useUserStore((s) => s.points)
  const leaderboard = useMemo(() => buildLeaderboard(models, points), [models, points])

  const medals = ['🥇', '🥈', '🥉']



  return (

    <PageTransition>

      <FadeInContainer>

        <FadeInItem>

          <div className="mb-8">

            <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">

              <Trophy size={32} strokeWidth={1.5} />

              ლიდერბორდი

            </h1>

            <p className="text-[var(--text-muted)] mt-2 text-lg">მოდელების რეიტინგი ქულების მიხედვით</p>

          </div>

        </FadeInItem>



        {leaderboard.length === 0 ? (

          <Card hover={false} className="text-center py-16">

            <Trophy className="mx-auto text-[var(--text-subtle)] mb-3" size={32} />

            <p className="text-[var(--text-muted)]">მოდელები ჯერ არ არის</p>

          </Card>

        ) : (

          <div className="space-y-4">

            {leaderboard.map((model, i) => {

              const progress = (model.points / maxPoints) * 100

              return (

                <FadeInItem key={model.id}>

                  <Card

                    hover

                    onClick={() => navigate(`/models/${model.id}`)}

                    className={i === 0 ? 'border-[var(--border-medium)]' : ''}

                  >

                    <div className="flex items-center gap-4">

                      <div className="text-3xl w-12 text-center">

                        {medals[i] || (

                          <span className="text-lg text-[var(--text-muted)]">#{i + 1}</span>

                        )}

                      </div>



                      <ModelAvatar src={model.avatar} name={model.name} size="sm" />



                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2">

                          <h3 className="font-semibold truncate text-[var(--text-primary)]">{model.name}</h3>

                          {i === 0 && (

                            <span

                              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"

                              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}

                            >

                              <Star size={10} /> ელიტა

                            </span>

                          )}

                        </div>

                        <p className="text-xs text-[var(--text-muted)]">{model.tagline}</p>



                        <div

                          className="mt-3 h-1.5 rounded-full overflow-hidden"

                          style={{ background: 'var(--bg-hover)' }}

                        >

                          <motion.div

                            initial={{ width: 0 }}

                            animate={{ width: `${progress}%` }}

                            transition={{ duration: 1, delay: i * 0.12 }}

                            className="h-full rounded-full"

                            style={{ background: 'var(--accent)' }}

                          />

                        </div>

                      </div>



                      <div className="text-right">

                        <p className="text-2xl font-semibold text-[var(--text-primary)]">{model.points}</p>

                        <p className="text-[10px] text-[var(--text-muted)]">ქულა</p>

                      </div>

                    </div>

                  </Card>

                </FadeInItem>

              )

            })}

          </div>

        )}

      </FadeInContainer>

    </PageTransition>

  )

}

