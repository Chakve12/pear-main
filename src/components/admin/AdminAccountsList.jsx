import { useMemo, useState } from 'react'
import { Crown, Shield, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../ui/Card'
import ModelAvatar from '../ui/ModelAvatar'
import { useUserStore } from '../../store/useUserStore'
import { deleteAdminAccount } from '../../services/usersService'
import { isAdminRole, isHeadAdmin, roleLabel } from '../../utils/roles'

export default function AdminAccountsList() {
  const { user, role, userProfiles } = useUserStore()
  const [deletingUid, setDeletingUid] = useState(null)

  const accounts = useMemo(
    () =>
      Object.values(userProfiles)
        .filter((p) => isAdminRole(p.role))
        .sort((a, b) => {
          if (a.role === 'head_admin') return -1
          if (b.role === 'head_admin') return 1
          return (a.displayName || a.email).localeCompare(b.displayName || b.email)
        }),
    [userProfiles]
  )

  const handleDelete = async (account) => {
    if (!user || !isHeadAdmin(role)) return
    if (account.role !== 'admin') {
      toast.error('უფროს ადმინის ანგარიში ვერ წაიშლება')
      return
    }
    if (account.uid === user.uid) {
      toast.error('საკუთარი ანგარიშის წაშლა შეუძლებელია')
      return
    }
    if (!window.confirm(`წავშალოთ ადმინი "${account.displayName || account.email}"?`)) return

    setDeletingUid(account.uid)
    try {
      await deleteAdminAccount({
        targetUid: account.uid,
        requesterUid: user.uid,
        requesterRole: role,
      })
      toast.success('ადმინის ანგარიში წაიშალა')
    } catch (err) {
      toast.error(err.message || 'წაშლა ვერ მოხერხდა')
    } finally {
      setDeletingUid(null)
    }
  }

  return (
    <Card hover={false}>
      <h3 className="font-semibold mb-1 flex items-center gap-2 text-[var(--text-primary)]">
        <Shield size={18} />
        ადმინისტრატორები
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-5">
        {isHeadAdmin(role)
          ? 'უფროს ადმინს შეუძლია სხვა ადმინის ანგარიშების წაშლა'
          : 'ადმინისტრატორების სია'}
      </p>

      <div className="space-y-2">
        {accounts.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">ადმინები ჯერ არ არის</p>
        )}
        {accounts.map((account) => (
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
              {account.role === 'head_admin' ? <Crown size={10} /> : <Shield size={10} />}
              {roleLabel(account.role)}
            </span>
            {isHeadAdmin(role) && account.role === 'admin' && account.uid !== user?.uid && (
              <button
                type="button"
                onClick={() => handleDelete(account)}
                disabled={deletingUid === account.uid}
                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                title="ადმინის წაშლა"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
