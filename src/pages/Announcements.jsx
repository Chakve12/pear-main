import { motion } from 'framer-motion'

import { Pin, Clock } from 'lucide-react'

import PageTransition from '../components/animations/PageTransition'

import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'

import Card from '../components/ui/Card'

import { useUserStore } from '../store/useUserStore'



function formatDate(iso) {

  return new Date(iso).toLocaleDateString('ka-GE', {

    month: 'short',

    day: 'numeric',

    year: 'numeric',

  })

}



export default function Announcements() {

  const announcements = useUserStore((s) => s.announcements)

  const sorted = [...announcements].sort((a, b) => {

    if (a.pinned && !b.pinned) return -1

    if (!a.pinned && b.pinned) return 1

    return new Date(b.createdAt) - new Date(a.createdAt)

  })



  return (

    <PageTransition>

      <FadeInContainer>

        <FadeInItem>

          <div className="mb-8">

            <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)]">

              განცხადებები

            </h1>

            <p className="text-[var(--text-muted)] mt-2 text-lg">სიახლეები PEAR™-ისგან</p>

          </div>

        </FadeInItem>



        <div className="space-y-4 max-w-3xl">

          {sorted.map((ann, i) => (

            <FadeInItem key={ann.id}>

              <motion.div

                initial={{ opacity: 0, x: -20 }}

                animate={{ opacity: 1, x: 0 }}

                transition={{ delay: i * 0.08 }}

              >

                <Card hover={false} className={ann.pinned ? 'border-[var(--border-medium)]' : ''}>

                  <div className="flex items-start gap-3">

                    {ann.pinned && (

                      <Pin size={16} className="text-[var(--accent)] mt-1 shrink-0" />

                    )}

                    <div className="flex-1">

                      <div className="flex items-center gap-2 flex-wrap">

                        <h3 className="font-semibold text-lg text-[var(--text-primary)]">{ann.title}</h3>

                        {ann.pinned && (

                          <span

                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"

                            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}

                          >

                            მიმაგრებული

                          </span>

                        )}

                      </div>

                      <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">{ann.content}</p>

                      <div className="flex items-center gap-4 mt-4 text-xs text-[var(--text-muted)]">

                        <span>{ann.author}</span>

                        <span className="flex items-center gap-1">

                          <Clock size={12} />

                          {formatDate(ann.createdAt)}

                        </span>

                      </div>

                    </div>

                  </div>

                </Card>

              </motion.div>

            </FadeInItem>

          ))}

        </div>

      </FadeInContainer>

    </PageTransition>

  )

}

