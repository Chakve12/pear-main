import { useMemo, useState } from 'react'
import { Crown, Radio, Shield, Trash2, User } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../ui/Card'
import ModelAvatar from '../ui/ModelAvatar'
import { useUserStore } from '../../store/useUserStore'
import { deleteAccount } from '../../services/usersService'
import { deleteModel } from '../../services/modelsService'
import { isUsingLocalAuth } from '../../services/authService'
import { isHeadAdmin, roleLabel } from '../../utils/roles'

const ROLE_ORDER = { head_admin: 0, admin: 1, model: 2 }

function roleIcon(role) {
  if (role === 'head_admin') return Crown
  if (role === 'admin') return Shield
  return User
}

export default function AdminAccountsList() {
  const { user, role, userProfiles, profilesLoaded, removeModel } = useUserStore()
  const [deletingUid, setDeletingUid] = useState(null)
  const isLive = !isUsingLocalAuth()

  const accounts = useMemo(
    () =>
      Object.values(userProfiles).sort((a, b) => {
        const roleDiff = (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
        if (roleDiff !== 0) return roleDiff
        return (a.displayName || a.email).localeCompare(b.displayName || b.email)
      }),
    [userProfiles]
  )

  const handleDelete = async (account) => {
    if (!user || !isHeadAdmin(role)) return
    if (account.role === 'head_admin') {
      toast.error('უფროს ადმინის ანგარიში ვერ წაიშლება')
      return
    }
    if (account.uid === user.uid) {
      toast.error('საკუთარი ანგარიშის წაშლა შეუძლებელია')
      return
    }
    const label = account.displayName || account.email
    if (!window.confirm(`წავშალოთ ანგარიში "${label}"? ეს სრულად წაიშლის auth.users-იდან და profiles-იდან.`)) return

    setDeletingUid(account.uid)
    try {
      await deleteAccount({
        targetUid: account.uid,
        requesterUid: user.uid,
        requesterRole: role,
      })
      if (account.modelId) {
        try {
          await deleteModel(account.modelId)
        } catch {
          /* RPC/edge function may have already removed the model row */
        }
        removeModel(account.modelId)
      }
      toast.success('ანგარიში წაიშალა')
    } catch (err) {
      toast.error(err.message || 'წაშლა ვერ მოხერხდა')
    } finally {
      setDeletingUid(null)
    }
  }

  return (
    <Card hover={false}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="font-semibold mb-1 flex items-center gap-2 text-[var(--text-primary)]">
            <Shield size={18} />
            ანგარიშები
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {isLive
              ? 'Supabase profiles ცხრილიდან · live განახლება'
              : 'ლოკალური რეჟიმი — მხოლოდ ამ ბრაუზერის ანგარიშები'}
          </p>
        </div>
        {isLive && profilesLoaded && (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium shrink-0"
            style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}
          >
            <Radio size={10} className="animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div className="space-y-2">
        {!profilesLoaded && isLive && (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">ანგარიშები იტვირთება...</p>
        )}
        {profilesLoaded && accounts.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">ანგარიშები ჯერ არ არის</p>
        )}
        {accounts.map((account) => {
          const RoleIcon = roleIcon(account.role)
          return (
            <div
              key={account.uid}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}
            >
              <ModelAvatar
                src={account.avatar}
                name={account.displayName || account.email}
                size="xs"
                className="!rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {account.displayName || account.email}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">{account.email}</p>
              </div>
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <RoleIcon size={10} />
                {roleLabel(account.role)}
              </span>
              {isHeadAdmin(role) && account.role !== 'head_admin' && account.uid !== user?.uid && (
                <button
                  type="button"
                  onClick={() => handleDelete(account)}
                  disabled={deletingUid === account.uid}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  title="ანგარიშის წაშლა"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
