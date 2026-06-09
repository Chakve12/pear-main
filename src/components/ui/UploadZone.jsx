import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Button from './Button'

export default function UploadZone({ onUpload, uploading = false, progress = 0 }) {
  const [dragOver, setDragOver] = useState(false)
  const [previews, setPreviews] = useState([])

  const processFiles = useCallback((files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'))
    setPreviews((prev) => [
      ...prev,
      ...valid.map((file) => ({ file, url: URL.createObjectURL(file), name: file.name })),
    ])
  }, [])

  const removePreview = (index) => {
    setPreviews((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].url)
      next.splice(index, 1)
      return next
    })
  }

  const handleUpload = async () => {
    if (!previews.length) return
    await onUpload(previews.map((p) => p.file))
    previews.forEach((p) => URL.revokeObjectURL(p.url))
    setPreviews([])
  }

  return (
    <div className="space-y-4">
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files) }}
        animate={{ borderColor: dragOver ? 'var(--accent)' : 'var(--border-subtle)' }}
        className="relative border-2 border-dashed rounded-2xl p-10 text-center transition-all"
        style={{ background: dragOver ? 'var(--accent-soft)' : 'transparent' }}
      >
        <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => processFiles(e.target.files)} />
        <Upload className="mx-auto mb-3 text-[var(--text-muted)]" size={32} strokeWidth={1.5} />
        <p className="text-sm text-[var(--text-muted)]">
          გადაიტანე ფოტოები აქ, ან <span className="text-[var(--accent)] font-medium">აირჩიე</span>
        </p>
      </motion.div>

      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {previews.map((preview, i) => (
              <div key={preview.url} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                <button onClick={() => removePreview(i)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 opacity-0 group-hover:opacity-100">
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {uploading && (
        <div className="space-y-2">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
            <motion.div className="h-full" style={{ background: 'var(--accent)' }} animate={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--text-muted)] text-center">{Math.round(progress)}%</p>
        </div>
      )}

      {previews.length > 0 && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          <ImageIcon size={16} />
          {previews.length} ფოტოს ატვირთვა
        </Button>
      )}
    </div>
  )
}
