import { useState } from 'react'
import { Cloud, CloudOff, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import { isUsingLocalAuth, migrateLocalUsersToCloud } from '../../services/authService'
import { getLocalCustomUserCount, hasLocalCustomUsers } from '../../services/localAuth'

export default function CloudAuthBanner() {
  const localMode = isUsingLocalAuth()
  const [migrating, setMigrating] = useState(false)
  const [migrationDone, setMigrationDone] = useState(false)

  if (!localMode && !hasLocalCustomUsers()) return null

  const handleMigrate = async () => {
    setMigrating(true)
    try {
      const results = await migrateLocalUsersToCloud()
      const ok = results.filter((r) => r.ok).length
      const failed = results.filter((r) => !r.ok)
      if (ok) {
        toast.success(`${ok} ანგარიში გადავიდა ღრუბელში`)
        setMigrationDone(true)
      }
      if (failed.length) {
        toast.error(`${failed.length} ანგარიში ვერ გადავიდა — შეიძლება უკვე არსებობდეს`)
      }
      if (!ok && !failed.length) {
        toast('გადასატანი ანგარიში არ მოიძებნა')
      }
    } catch (err) {
      toast.error(err.message || 'მიგრაცია ვერ მოხერხდა')
    } finally {
      setMigrating(false)
    }
  }

  if (!localMode && hasLocalCustomUsers() && !migrationDone) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
        <div className="flex items-start gap-3">
          <Upload size={20} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
              ლოკალური ანგარიშების გადატანა
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              ამ ბრაუზერში შექმნილი {getLocalCustomUserCount()} ანგარიში ჯერ კიდევ ლოკალურადაა.
              გადაიტანე Supabase-ში, რომ სხვა მოწყობილობებიდანაც შეძლონ შესვლა.
            </p>
            <Button type="button" loading={migrating} onClick={handleMigrate}>
              <Upload size={16} />
              ანგარიშების გადატანა ღრუბელში
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!localMode) return null

  return (
    <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
      <div className="flex items-start gap-3">
        <CloudOff size={20} className="text-rose-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">
            ლოკალური რეჟიმი — სხვები ვერ შევა
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            ახლა ანგარიშები ინახება მხოლოდ ამ ბრაუზერში. ადმინ პანელით შექმნილი მომხმარებლები
            სხვა ტელეფონიდან ან კომპიუტერიდან ვერ შევა, სანამ Supabase არ დააყენებ.
          </p>
          <ol className="text-sm text-[var(--text-muted)] space-y-1.5 mb-4 list-decimal list-inside">
            <li>შექმენი პროექტი: <a href="https://supabase.com/dashboard" className="underline" target="_blank" rel="noreferrer">supabase.com/dashboard</a></li>
            <li>დააკოპირე URL და anon key → <code className="text-xs bg-black/20 px-1.5 py-0.5 rounded">.env</code> ფაილი</li>
            <li>SQL Editor-ში გაუშვი <code className="text-xs bg-black/20 px-1.5 py-0.5 rounded">supabase/schema.sql</code></li>
            <li>Authentication → Providers → Email ჩართვა (Confirm email გამორთვა)</li>
            <li>გადატვირთე: <code className="text-xs bg-black/20 px-1.5 py-0.5 rounded">npm run dev</code></li>
          </ol>
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Cloud size={14} />
            Supabase უფასოა მცირე გუნდებისთვის — 50K მომხმარებელი თვეში.
          </p>
        </div>
      </div>
    </div>
  )
}
