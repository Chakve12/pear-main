import { useState, useEffect } from 'react'

import { Navigate } from 'react-router-dom'

import { motion } from 'framer-motion'

import {

  Shield, Plus, Minus, Download, Trash2, Pin, Megaphone, Activity,

} from 'lucide-react'

import toast from 'react-hot-toast'

import PageTransition from '../components/animations/PageTransition'

import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'

import Card from '../components/ui/Card'

import Button from '../components/ui/Button'

import Modal from '../components/ui/Modal'

import { useUserStore } from '../store/useUserStore'

import { getModelImages, downloadBulk } from '../services/storage'

import { deleteModelFromFirestore, saveModel } from '../services/modelsService'
import { deleteAccount } from '../services/usersService'
import { adjustModelPoints, setModelPoints as saveModelPoints } from '../services/pointsService'
import {
  createAnnouncement,
  toggleAnnouncementPin,
  deleteAnnouncement as removeAnnouncement,
} from '../services/announcementsService'
import ModelAvatar from '../components/ui/ModelAvatar'

import CreateUserForm from '../components/admin/CreateUserForm'
import AdminAccountsList from '../components/admin/AdminAccountsList'
import CloudAuthBanner from '../components/admin/CloudAuthBanner'
import { isAdminRole, isHeadAdmin } from '../utils/roles'
import { isUsingLocalAuth } from '../services/authService'



export default function Admin() {

  const { role, points, addPoints, setPoints, addAnnouncement,

    togglePinAnnouncement, deleteAnnouncement, announcements, activityLog,

    models, removeModel, updateModel } = useUserStore()



  const [selectedModel, setSelectedModel] = useState(models[0]?.id || '')

  const [customPoints, setCustomPoints] = useState('')

  const [annTitle, setAnnTitle] = useState('')

  const [annContent, setAnnContent] = useState('')

  const [annPinned, setAnnPinned] = useState(false)

  const [allImages, setAllImages] = useState([])

  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const [activeTab, setActiveTab] = useState('users')



  useEffect(() => {

    if (models.length && !selectedModel) setSelectedModel(models[0].id)

  }, [models, selectedModel])



  useEffect(() => {

    if (!isAdminRole(role)) return

    loadAllImages()

  }, [role, models])



  const loadAllImages = async () => {

    const results = await Promise.all(

      models.map(async (m) => {

        const imgs = await getModelImages(m.id, 'uploaded')

        return imgs.map((img) => ({ ...img, modelName: m.name }))

      })

    )

    setAllImages(results.flat())

  }



  if (!isAdminRole(role)) {

    return <Navigate to="/dashboard" replace />

  }



  const handleAddAnnouncement = async () => {

    if (!annTitle.trim() || !annContent.trim()) {

      toast.error('სათაური და ტექსტი აუცილებელია')

      return

    }

    try {

      if (isUsingLocalAuth()) {
        addAnnouncement({ title: annTitle, content: annContent, pinned: annPinned })
      } else {
        await createAnnouncement({ title: annTitle.trim(), content: annContent.trim(), pinned: annPinned })
      }

      toast.success('განცხადება გამოქვეყნდა!')

      setAnnTitle('')

      setAnnContent('')

      setAnnPinned(false)

    } catch {

      toast.error('განცხადების გამოქვეყნება ვერ მოხერხდა')

    }

  }



  const handleBulkDownload = async () => {

    toast.loading('ფოტოები იტვირთება...')

    await downloadBulk(allImages)

    toast.dismiss()

    toast.success(`${allImages.length} ფოტო ჩამოიტვირთა`)

    setShowDownloadModal(false)

  }



  const handleDeleteModel = async (modelId) => {

    const model = models.find((m) => m.id === modelId)

    if (!model) return

    if (!window.confirm(`წავშალოთ მოდელი "${model.name}" და მისი ანგარიში?`)) return

    try {

      const profiles = useUserStore.getState().userProfiles
      const linked = Object.values(profiles).find((p) => p.modelId === modelId)

      if (linked && isHeadAdmin(role)) {
        await deleteAccount({
          targetUid: linked.uid,
          requesterUid: useUserStore.getState().user.uid,
          requesterRole: role,
        })
      } else {
        await deleteModelFromFirestore(modelId)
      }

      removeModel(modelId)

      if (selectedModel === modelId) setSelectedModel(models.find((m) => m.id !== modelId)?.id || '')

      toast.success('მოდელი და ანგარიში წაიშალა')

    } catch (err) {

      toast.error(err.message || 'წაშლა ვერ მოხერხდა')

    }

  }



  const tabs = [

    { id: 'users', label: 'მომხმარებლები', icon: Shield },

    { id: 'announcements', label: 'განცხადებები', icon: Megaphone },

    { id: 'images', label: 'ფოტოები', icon: Download },

    { id: 'activity', label: 'აქტივობა', icon: Activity },

  ]



  return (

    <PageTransition>

      <FadeInContainer>

        <FadeInItem>

          <div className="mb-8">

            <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">

              <Shield />

              ადმინ პანელი

            </h1>

            <p className="text-[var(--text-muted)] mt-2 text-lg">PEAR™ Elite სრული მართვის ცენტრი</p>

          </div>

        </FadeInItem>



        <FadeInItem>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">

            {tabs.map((tab) => (

              <button

                key={tab.id}

                onClick={() => setActiveTab(tab.id)}

                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${

                  activeTab === tab.id

                    ? 'nav-link-active'

                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border'

                }`}

                style={activeTab !== tab.id ? { borderColor: 'var(--border-subtle)' } : undefined}

              >

                <tab.icon size={16} />

                {tab.label}

              </button>

            ))}

          </div>

        </FadeInItem>



        {activeTab === 'users' && (

          <FadeInItem>

            <CloudAuthBanner />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              <CreateUserForm />

              <AdminAccountsList />

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <Card hover={false}>

                <h3 className="font-semibold mb-4 text-[var(--text-primary)]">მოდელების მართვა</h3>

                <div className="space-y-3">

                  {models.length === 0 && (

                    <p className="text-sm text-[var(--text-muted)] text-center py-6">მოდელები ჯერ არ არის</p>

                  )}

                  {models.map((model) => (

                    <div

                      key={model.id}

                      className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${

                        selectedModel === model.id

                          ? 'border-[var(--border-medium)]'

                          : 'border-transparent hover:bg-[var(--bg-hover)]'

                      }`}

                      style={selectedModel === model.id ? { background: 'var(--bg-hover)' } : undefined}

                    >

                      <button

                        onClick={() => setSelectedModel(model.id)}

                        className="flex items-center gap-3 flex-1 text-left"

                      >

                        <ModelAvatar src={model.avatar} name={model.name} size="xs" className="!rounded-lg" />

                        <div className="flex-1 min-w-0">

                          <p className="text-sm font-medium text-[var(--text-primary)]">{model.name}</p>

                          <p className="text-xs text-[var(--text-muted)] truncate">{model.email}</p>

                        </div>

                        <span className="text-sm font-semibold text-[var(--accent)]">

                          {points[model.id] || 0} ქულა

                        </span>

                      </button>

                      <button

                        onClick={() => handleDeleteModel(model.id)}

                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-hover)] transition-colors"

                        title="წაშლა"

                      >

                        <Trash2 size={14} />

                      </button>

                    </div>

                  ))}

                </div>

              </Card>



              <Card hover={false}>

                <h3 className="font-semibold mb-4 text-[var(--text-primary)]">ქულების სისტემა</h3>

                <p className="text-sm text-[var(--text-muted)] mb-4">

                  მოდელი: {models.find((m) => m.id === selectedModel)?.name || '—'}

                </p>

                <div className="flex gap-2 mb-4">

                  <Button

                    variant="secondary"

                    disabled={!selectedModel}

                    onClick={async () => {

                      try {

                        if (isUsingLocalAuth()) {
                          addPoints(selectedModel, 10)
                        } else {
                          await adjustModelPoints(selectedModel, 10)
                        }

                        toast.success('+10 ქულა')

                      } catch {

                        toast.error('ქულის განახლება ვერ მოხერხდა')

                      }

                    }}

                  >

                    <Plus size={16} /> +10

                  </Button>

                  <Button

                    variant="secondary"

                    disabled={!selectedModel}

                    onClick={async () => {

                      try {

                        if (isUsingLocalAuth()) {
                          addPoints(selectedModel, -10)
                        } else {
                          await adjustModelPoints(selectedModel, -10)
                        }

                        toast.success('-10 ქულა')

                      } catch {

                        toast.error('ქულის განახლება ვერ მოხერხდა')

                      }

                    }}

                  >

                    <Minus size={16} /> -10

                  </Button>

                </div>

                <div className="flex gap-2 mb-6">

                  <input

                    type="number"

                    value={customPoints}

                    onChange={(e) => setCustomPoints(e.target.value)}

                    placeholder="ქულის რაოდენობა"

                    className="admin-input flex-1"

                    disabled={!selectedModel}

                  />

                  <Button

                    disabled={!selectedModel}

                    onClick={async () => {

                      const val = parseInt(customPoints, 10)

                      if (isNaN(val)) return toast.error('შეიყვანე რიცხვი')

                      try {

                        if (isUsingLocalAuth()) {
                          setPoints(selectedModel, val)
                        } else {
                          await saveModelPoints(selectedModel, val)
                        }

                        toast.success(`ქულა დაყენდა: ${val}`)

                        setCustomPoints('')

                      } catch {

                        toast.error('ქულის განახლება ვერ მოხერხდა')

                      }

                    }}

                  >

                    დაყენება

                  </Button>

                </div>



                {selectedModel && (

                  <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>

                    <h4 className="text-sm font-medium text-[var(--text-primary)]">პროფილის რედაქტირება</h4>

                    <input

                      key={selectedModel}

                      defaultValue={models.find((m) => m.id === selectedModel)?.name || ''}

                      placeholder="სახელი"

                      className="admin-input"

                      onBlur={async (e) => {
                        const val = e.target.value.trim()
                        if (val) {
                          updateModel(selectedModel, { name: val })
                          const model = models.find((m) => m.id === selectedModel)
                          if (model) await saveModel({ ...model, name: val })
                          toast.success('სახელი განახლდა')
                        }
                      }}

                    />

                    <input

                      key={`${selectedModel}-tag`}

                      defaultValue={models.find((m) => m.id === selectedModel)?.tagline || ''}

                      placeholder="აღწერა"

                      className="admin-input"

                      onBlur={async (e) => {
                        const val = e.target.value.trim()
                        if (val) {
                          updateModel(selectedModel, { tagline: val })
                          const model = models.find((m) => m.id === selectedModel)
                          if (model) await saveModel({ ...model, tagline: val })
                          toast.success('აღწერა განახლდა')
                        }
                      }}

                    />

                  </div>

                )}

              </Card>

            </div>

          </FadeInItem>

        )}



        {activeTab === 'announcements' && (

          <FadeInItem>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <Card hover={false}>

                <h3 className="font-semibold mb-4 text-[var(--text-primary)]">განცხადების შექმნა</h3>

                <div className="space-y-4">

                  <input

                    value={annTitle}

                    onChange={(e) => setAnnTitle(e.target.value)}

                    placeholder="სათაური"

                    className="admin-input"

                  />

                  <textarea

                    value={annContent}

                    onChange={(e) => setAnnContent(e.target.value)}

                    placeholder="ტექსტი"

                    rows={4}

                    className="admin-input resize-none"

                  />

                  <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">

                    <input

                      type="checkbox"

                      checked={annPinned}

                      onChange={(e) => setAnnPinned(e.target.checked)}

                      className="rounded"

                    />

                    განცხადების მიმაგრება

                  </label>

                  <Button onClick={handleAddAnnouncement} className="w-full">

                    <Megaphone size={16} /> გამოქვეყნება

                  </Button>

                </div>

              </Card>



              <Card hover={false}>

                <h3 className="font-semibold mb-4 text-[var(--text-primary)]">პოსტების მართვა</h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">

                  {announcements.map((ann) => (

                    <div key={ann.id} className="flex items-start gap-3 p-3 rounded-xl glass">

                      <div className="flex-1">

                        <p className="text-sm font-medium text-[var(--text-primary)]">{ann.title}</p>

                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1">

                          {ann.content}

                        </p>

                      </div>

                      <div className="flex gap-1">

                        <button

                          onClick={async () => {

                            try {

                              if (isUsingLocalAuth()) {
                                togglePinAnnouncement(ann.id)
                              } else {
                                await toggleAnnouncementPin(ann.id, !ann.pinned)
                              }

                              toast.success(ann.pinned ? 'მოხსნილია' : 'მიმაგრებულია')

                            } catch {

                              toast.error('განახლება ვერ მოხერხდა')

                            }

                          }}

                          className={`p-1.5 rounded-lg hover:bg-[var(--bg-hover)] ${

                            ann.pinned ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'

                          }`}

                        >

                          <Pin size={14} />

                        </button>

                        <button

                          onClick={async () => {

                            try {

                              if (isUsingLocalAuth()) {
                                deleteAnnouncement(ann.id)
                              } else {
                                await removeAnnouncement(ann.id)
                              }

                              toast.success('წაიშალა')

                            } catch {

                              toast.error('წაშლა ვერ მოხერხდა')

                            }

                          }}

                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400"

                        >

                          <Trash2 size={14} />

                        </button>

                      </div>

                    </div>

                  ))}

                </div>

              </Card>

            </div>

          </FadeInItem>

        )}



        {activeTab === 'images' && (

          <FadeInItem>

            <Card hover={false}>

              <div className="flex items-center justify-between mb-4">

                <h3 className="font-semibold text-[var(--text-primary)]">ყველა ფოტო ({allImages.length})</h3>

                <Button onClick={() => setShowDownloadModal(true)} disabled={allImages.length === 0}>

                  <Download size={16} /> ყველას ჩამოტვირთვა

                </Button>

              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">

                {allImages.map((img) => (

                  <div key={img.id} className="aspect-square rounded-lg overflow-hidden group relative">

                    <img src={img.url} alt={img.name} loading="lazy" className="w-full h-full object-cover" />

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">

                      <p className="text-[8px] text-white truncate">{img.modelName}</p>

                    </div>

                  </div>

                ))}

              </div>

            </Card>

          </FadeInItem>

        )}



        {activeTab === 'activity' && (

          <FadeInItem>

            <Card hover={false}>

              <h3 className="font-semibold mb-4 flex items-center gap-2 text-[var(--text-primary)]">

                <Activity size={18} className="text-[var(--accent)]" />

                აქტივობის ქრონოლოგია

              </h3>

              <div className="relative">

                <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: 'var(--border-subtle)' }} />

                <div className="space-y-4">

                  {activityLog.map((entry, i) => (

                    <motion.div

                      key={entry.id}

                      initial={{ opacity: 0, x: -20 }}

                      animate={{ opacity: 1, x: 0 }}

                      transition={{ delay: i * 0.05 }}

                      className="flex gap-4 pl-8 relative"

                    >

                      <div

                        className="absolute left-2.5 w-3 h-3 rounded-full border-2"

                        style={{ background: 'var(--accent)', borderColor: 'var(--bg-card-solid)' }}

                      />

                      <div className="flex-1 p-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>

                        <p className="text-sm text-[var(--text-primary)]">{entry.action}</p>

                        <p className="text-xs text-[var(--text-muted)] mt-1">

                          {entry.user} · {new Date(entry.timestamp).toLocaleString()}

                        </p>

                      </div>

                    </motion.div>

                  ))}

                </div>

              </div>

            </Card>

          </FadeInItem>

        )}

      </FadeInContainer>



      <Modal

        isOpen={showDownloadModal}

        onClose={() => setShowDownloadModal(false)}

        title="ყველას ჩამოტვირთვა"

      >

        <p className="text-sm text-[var(--text-muted)] mb-4">

          ჩამოვტვირთოთ ყველა {allImages.length} ფოტო ყველა მოდელისგან?

        </p>

        <div className="flex gap-3">

          <Button variant="secondary" onClick={() => setShowDownloadModal(false)} className="flex-1">

            გაუქმება

          </Button>

          <Button onClick={handleBulkDownload} className="flex-1">

            <Download size={16} /> ყველას ჩამოტვირთვა

          </Button>

        </div>

      </Modal>

    </PageTransition>

  )

}

