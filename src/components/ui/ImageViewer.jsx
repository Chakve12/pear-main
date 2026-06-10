import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, X, Download, Trash2 } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { downloadImage } from '../../services/storage'
import toast from 'react-hot-toast'

export default function ImageViewer({ 
  image, 
  isOpen, 
  onClose, 
  showDownload = false, 
  canDelete = false,
  onDelete = null 
}) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [deleting, setDeleting] = useState(false)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  if (!image) return null

  const handleWheel = (e) => {
    e.preventDefault()
    setScale((s) => Math.min(4, Math.max(0.5, s + (e.deltaY > 0 ? -0.2 : 0.2))))
  }

  const handleMouseDown = (e) => {
    if (scale <= 1) return
    dragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e) => {
    if (!dragging.current) return
    setPosition((p) => ({
      x: p.x + e.clientX - lastPos.current.x,
      y: p.y + e.clientY - lastPos.current.y,
    }))
    lastPos.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    dragging.current = false
  }

  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleDelete = async () => {
    if (!window.confirm('დაზღვეულია? ეს ფოტო სამუდამოდ წაიშლება')) return
    
    setDeleting(true)
    try {
      if (onDelete) {
        await onDelete(image)
      }
      toast.success('ფოტო წაიშალა')
      onClose()
    } catch (error) {
      toast.error(error.message || 'წაშლა ვერ მოხერხდა')
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <div className="relative -m-6">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="secondary" onClick={() => setScale((s) => Math.min(4, s + 0.5))}>
            <ZoomIn size={16} />
          </Button>
          <Button variant="secondary" onClick={() => setScale((s) => Math.max(0.5, s - 0.5))}>
            <ZoomOut size={16} />
          </Button>
          {showDownload && (
            <Button variant="secondary" onClick={() => downloadImage(image.url, image.name)}>
              <Download size={16} />
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="secondary" 
              onClick={handleDelete}
              disabled={deleting}
              style={{ color: deleting ? 'var(--text-muted)' : '#ef4444' }}
            >
              <Trash2 size={16} />
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            <X size={16} />
          </Button>
        </div>

        <div
          className="h-[80vh] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={resetView}
        >
          <motion.img
            src={image.url}
            alt={image.name}
            style={{
              scale,
              x: position.x,
              y: position.y,
            }}
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
            loading="lazy"
          />
        </div>
      </div>
    </Modal>
  )
}
