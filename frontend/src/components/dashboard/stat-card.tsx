import type { ReactNode } from 'react'

type StatCardProps = {
  title: string
  value: string
  detail: string
  label?: string
  compact?: boolean
  icon?: ReactNode
}

export function StatCard({ title, value, detail, label, compact = false, icon }: StatCardProps) {
  if (compact) {
    return (
      <div className="flex min-h-[104px] flex-col items-center justify-center rounded-2xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-100 sm:min-h-[122px] sm:rounded-3xl sm:px-3 sm:py-4">
        {icon ? <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[var(--school-blue)] sm:h-10 sm:w-10">{icon}</div> : null}
        <p className="mt-2 max-w-full truncate text-sm font-semibold leading-tight text-slate-950 sm:mt-3 sm:text-base">{value}</p>
        <p className="mt-1.5 max-w-full truncate text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:mt-2 sm:text-[9px] sm:tracking-[0.18em]">{label ?? title}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-5 xl:rounded-3xl xl:p-6">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          {label ? <p className="mb-0.5 truncate text-[10px] font-medium text-[var(--school-blue)] sm:text-[11px]">{label}</p> : null}
          <p className="truncate text-[11px] font-medium leading-4 text-slate-600 sm:text-sm">{title}</p>
          <p className="mt-1 break-words text-xl font-semibold leading-tight text-slate-950 sm:mt-3 sm:text-3xl">{value}</p>
          <p className="mt-1 truncate text-[10px] leading-4 text-slate-500 sm:mt-2 sm:text-sm">{detail}</p>
        </div>
        {icon ? <div className="shrink-0 rounded-xl bg-blue-50 p-2 text-[var(--school-blue)] sm:rounded-2xl sm:p-3">{icon}</div> : null}
      </div>
    </div>
  )
}
