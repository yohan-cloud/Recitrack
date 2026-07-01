import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

type StateMessageProps = {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
}

export function StateMessage({ title, description, icon, action }: StateMessageProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[var(--school-blue)]">
        {icon ?? <Inbox size={22} />}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
