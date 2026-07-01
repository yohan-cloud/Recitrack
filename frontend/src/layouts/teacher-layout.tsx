import { BookOpen, ChartColumn, FileText, LayoutDashboard, LogOut, Megaphone, MoreHorizontal, School, Settings, Users } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../lib/use-auth'

const links = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/sections', label: 'Sections', icon: School },
  { to: '/teacher/classes', label: 'Classes', icon: BookOpen },
  { to: '/teacher/students', label: 'Students', icon: Users },
  { to: '/teacher/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/teacher/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/teacher/reports', label: 'Reports', icon: FileText },
  { to: '/teacher/settings', label: 'Settings', icon: Settings }
]

export function TeacherLayout() {
  const { logout, user } = useAuth()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const primaryMobileLinks = links.slice(0, 4)
  const moreLinks = links.slice(4)
  const isMoreActive = moreLinks.some((item) => location.pathname.startsWith(item.to))

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
        <div className="px-1 lg:px-0">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--school-blue)]">ReciTrack</div>
          <h1 className="mt-2 text-2xl font-semibold">Teacher Portal</h1>
          <p className="mt-1 text-sm text-slate-500">Track recitation by subject and section.</p>
        </div>
        <nav className="mt-8 space-y-1">
          {links.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-[var(--school-blue)] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
                title={item.label}
              >
                <Icon className="shrink-0" size={18} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-auto flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          title="Sign out"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex justify-end px-3 py-2 lg:px-8 lg:py-3">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-right shadow-sm">
            <p className="text-[9px] leading-none text-slate-500">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p className="mt-1 text-[10px] font-semibold leading-none text-slate-800">{user?.username}</p>
          </div>
        </header>
        <main className="p-3 pb-24 sm:p-5 sm:pb-24 lg:p-8">
          <Outlet />
        </main>
      </div>
      <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 lg:hidden">
        {moreOpen ? (
          <div className="absolute bottom-20 right-0 w-56 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl">
            {moreLinks.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-[var(--school-blue)] text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                  title={item.label}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              title="Sign out"
            >
              <LogOut size={17} />
              <span>Sign out</span>
            </button>
          </div>
        ) : null}

        <nav className="flex items-center justify-around rounded-full border border-slate-200 bg-white/95 px-2 py-2 shadow-xl backdrop-blur">
          {primaryMobileLinks.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                `flex h-12 w-12 items-center justify-center rounded-full transition ${
                  isActive ? 'bg-[var(--school-blue)] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
              title={item.label}
            >
              <Icon size={20} />
            </NavLink>
          )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((current) => !current)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
              moreOpen || isMoreActive ? 'bg-[var(--school-blue)] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="More"
            aria-expanded={moreOpen}
            aria-label="More navigation"
          >
            <MoreHorizontal size={22} />
          </button>
        </nav>
      </div>
    </div>
  )
}
