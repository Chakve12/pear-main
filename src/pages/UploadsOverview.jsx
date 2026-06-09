import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, Image, ArrowRight } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import ModelAvatar from '../components/ui/ModelAvatar'
import { SkeletonCard } from '../components/ui/Loader'
import { useUserStore } from '../store/useUserStore'
import { isAdminRole } from '../utils/roles'
import { getModelImages } from '../services/storage'

export default function UploadsOverview() {
  const navigate = useNavigate()
  const { role, models } = useUserStore()
  const [modelData, setModelData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await Promise.all(
        models.map(async (model) => {
          const images = await getModelImages(model.id, 'uploaded')
          return { model, images }
        })
      )
      setModelData(data)
      setLoading(false)
    }
    load()
  }, [models])

  if (!isAdminRole(role)) {
    const modelId = useUserStore.getState().modelId
    if (!modelId) return <Navigate to="/dashboard" replace />
    return <Navigate to={`/models/${modelId}`} replace />
  }

  const totalUploads = modelData.reduce((sum, d) => sum + d.images.length, 0)

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)]">ატვირთვები</h1>
            <p className="text-[var(--text-muted)] mt-2 text-lg">სულ {totalUploads} ფოტო</p>
          </div>
        </FadeInItem>

        <div className="space-y-8">
          {loading
            ? models.map((m) => <SkeletonCard key={m.id} className="h-40 rounded-2xl" />)
            : modelData.map(({ model, images }) => (
                <FadeInItem key={model.id}>
                  <Card hover={false}>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <ModelAvatar src={model.avatar} name={model.name} size="sm" className="!rounded-xl" />
                        <div>
                          <h3 className="font-semibold text-lg text-[var(--text-primary)]">{model.name}</h3>
                          <p className="text-sm text-[var(--text-muted)]">{images.length} ფოტო</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/models/${model.id}`)}
                        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full text-[var(--text-primary)]"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        ნახვა <ArrowRight size={14} />
                      </button>
                    </div>
                    {images.length === 0 ? (
                      <div className="text-center py-10 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                        <Upload className="mx-auto text-[var(--text-muted)] mb-2" size={24} />
                        <p className="text-sm text-[var(--text-muted)]">ცარიელია</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {images.slice(0, 16).map((img) => (
                          <div key={img.id} className="aspect-square rounded-lg overflow-hidden cursor-pointer" onClick={() => navigate(`/models/${model.id}`)}>
                            <img src={img.url} alt={img.name} loading="lazy" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </FadeInItem>
              ))}
        </div>

        {!loading && models.length === 0 && (
          <Card hover={false} className="text-center py-16">
            <Image className="mx-auto text-[var(--text-subtle)] mb-4" size={40} />
            <p className="text-[var(--text-muted)]">მოდელები ჯერ არ არის</p>
          </Card>
        )}
      </FadeInContainer>
    </PageTransition>
  )
}
