import { AlertTriangle, X } from 'lucide-react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', loading = false, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <section className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-lg font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          </div>
          <button className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50" type="button" onClick={onCancel} title="Close dialog" disabled={loading}>
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60" type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60" type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
