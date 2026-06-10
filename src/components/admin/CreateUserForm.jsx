import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { adminCreateUser, isUsingLocalAuth } from '../../services/authService'
import { saveModel } from '../../services/modelsService'
import { logActivityEntry } from '../../services/activityService'
import { useUserStore, slugifyModelId } from '../../store/useUserStore'

export default function CreateUserForm() {
  const { logActivity, addModel, getModels } = useUserStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('model')
  const [tagline, setTagline] = useState('ელიტური მოდელი')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('ელფოსტა და პაროლი აუცილებელია')
      return
    }
    if (role === 'model' && !displayName.trim()) {
      toast.error('მოდელის სახელი აუცილებელია')
      return
    }
    if (password.length < 6) {
      toast.error('პაროლი მინიმუმ 6 სიმბოლო')
      return
    }

    setLoading(true)
    try {
      let modelId = null

      if (role === 'model') {
        const baseId = slugifyModelId(displayName, email)
        const models = getModels()
        modelId = baseId
        let counter = 1
        while (models.some((m) => m.id === modelId)) {
          modelId = `${baseId}${counter++}`
        }

        addModel({
          id: modelId,
          name: displayName.trim(),
          email: email.trim().toLowerCase(),
          tagline: tagline.trim() || 'ელიტური მოდელი',
          avatar: null,
        })
        await saveModel({
          id: modelId,
          name: displayName.trim(),
          email: email.trim().toLowerCase(),
          tagline: tagline.trim() || 'ელიტური მოდელი',
        })
      }

      const user = await adminCreateUser({
        email: email.trim(),
        password,
        displayName: displayName.trim() || email.split('@')[0],
        role,
        modelId,
      })

      const activityText = `შეიქმნა ანგარიში: ${user.displayName || user.email}`
      if (isUsingLocalAuth()) {
        logActivity(activityText, 'ადმინი')
      } else {
        await logActivityEntry(activityText, 'ადმინი')
      }
      const localOnly = isUsingLocalAuth()
      toast.success(
        role === 'model'
          ? `ანგარიში და მოდელი შეიქმნა — ${displayName}`
          : `ადმინის ანგარიში შეიქმნა — ${user.email}`,
        { duration: localOnly ? 8000 : 4000 }
      )
      if (localOnly) {
        toast(
          'ლოკალური რეჟიმი: ეს ანგარიში მხოლოდ ამ ბრაუზერში მუშაობს. სხვებისთვის Supabase დააყენე.',
          { icon: '⚠️', duration: 10000 }
        )
      }

      setEmail('')
      setPassword('')
      setDisplayName('')
      setTagline('ელიტური მოდელი')
      setRole('model')
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'ეს ელფოსტა უკვე გამოყენებულია'
          : err.code === 'auth/email-rate-limit'
            ? err.message
            : err.message || 'ანგარიშის შექმნა ვერ მოხერხდა'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card hover={false}>
      <h3 className="font-semibold mb-1 flex items-center gap-2 text-[var(--text-primary)]">
        <UserPlus size={18} />
        ახალი ანგარიშის შექმნა
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-5">
        {isUsingLocalAuth()
          ? 'ლოკალური რეჟიმი — ანგარიში მხოლოდ ამ ბრაუზერში იმუშავებს. სხვებისთვის ჩართე Supabase.'
          : 'მოდელის ანგარიში ავტომატურად დაემატება მოდელების სექციაში და ყველას შეძლებს შესვლას.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1.5 block">როლი</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="admin-input">
            <option value="model">მოდელი</option>
            <option value="admin">ადმინი</option>
          </select>
        </div>

        {role === 'model' && (
          <>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1.5 block">სახელი *</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="მაგ: ნინუცი" className="admin-input" required />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1.5 block">აღწერა</label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="ელიტური მოდელი" className="admin-input" />
            </div>
          </>
        )}

        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1.5 block">ელფოსტა *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="user@pear.elite" className="admin-input" />
        </div>

        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1.5 block">პაროლი *</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="მინ. 6 სიმბოლო" className="admin-input" />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          <UserPlus size={16} />
          {role === 'model' ? 'მოდელის შექმნა' : 'ადმინის შექმნა'}
        </Button>
      </form>
    </Card>
  )
}
