import { useEffect, useRef, useState } from 'react'
import { Award, CalendarDays, ChartNoAxesColumn, ChevronLeft, ChevronRight, ListChecks, Megaphone, MoreVertical, ShieldCheck, Sparkles } from 'lucide-react'
import { StatCard } from '../../components/dashboard/stat-card'
import { useAuth } from '../../lib/use-auth'
import { getMyAnnouncements, getMyClasses, getMyDashboard } from '../../services/student'
import type { StudentAnnouncement, StudentClass, StudentDashboard } from '../../types/student'

const rankTiers = [
  { name: 'Iron', min: 0, tone: 'from-slate-100 to-slate-300', iconTone: 'text-slate-500' },
  { name: 'Bronze', min: 2, tone: 'from-orange-100 to-orange-300', iconTone: 'text-orange-700' },
  { name: 'Silver', min: 4, tone: 'from-slate-100 to-slate-300', iconTone: 'text-slate-600' },
  { name: 'Gold', min: 6, tone: 'from-yellow-100 to-yellow-300', iconTone: 'text-yellow-700' },
  { name: 'Platinum', min: 9, tone: 'from-cyan-100 to-cyan-300', iconTone: 'text-cyan-700' },
  { name: 'Diamond', min: 12, tone: 'from-indigo-100 to-blue-300', iconTone: 'text-indigo-700' },
  { name: 'Ascendant', min: 16, tone: 'from-emerald-100 to-emerald-300', iconTone: 'text-emerald-700' },
  { name: 'Immortal', min: 20, tone: 'from-rose-100 to-rose-300', iconTone: 'text-rose-700' },
  { name: 'Radiant', min: 25, tone: 'from-blue-100 to-blue-400', iconTone: 'text-[var(--school-blue)]' }
]

function getRankProgress(total: number) {
  const currentIndex = [...rankTiers].reverse().findIndex((tier) => total >= tier.min)
  const tierIndex = currentIndex >= 0 ? rankTiers.length - 1 - currentIndex : 0
  const currentTier = rankTiers[tierIndex]
  const nextTier = rankTiers[tierIndex + 1] ?? null
  const progress = nextTier ? Math.min(100, Math.round(((total - currentTier.min) / (nextTier.min - currentTier.min)) * 100)) : 100
  const remaining = nextTier ? Math.max(0, nextTier.min - total) : 0

  return { currentTier, nextTier, progress, remaining }
}

export function StudentDashboardPage() {
  const { accessToken, user } = useAuth()
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null)
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([])
  const [contextOpen, setContextOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const rankScrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!accessToken) {
      return
    }

    const loadClasses = async () => {
      try {
        setLoading(true)
        setError('')
        const classList = await getMyClasses(accessToken)
        setClasses(classList)
        setSelectedClassId(classList[0]?.id ?? '')
      } catch {
        setError('Unable to load your subjects.')
      } finally {
        setLoading(false)
      }
    }

    void loadClasses()
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !selectedClassId) {
      setDashboard(null)
      setAnnouncements([])
      return
    }

    const loadDashboard = async () => {
      try {
        setError('')
        const [dashboardData, announcementList] = await Promise.all([
          getMyDashboard(accessToken, selectedClassId),
          getMyAnnouncements(accessToken, selectedClassId)
        ])
        setDashboard(dashboardData)
        setAnnouncements(announcementList)
      } catch {
        setError('Unable to load your dashboard.')
      }
    }

    void loadDashboard()
  }, [accessToken, selectedClassId])

  const selectedClass = dashboard?.class ?? classes.find((cls) => cls.id === selectedClassId)
  const totalRecitations = dashboard?.stats.totalRecitations ?? 0
  const rankProgress = getRankProgress(totalRecitations)
  const activeRankIndex = rankTiers.findIndex((tier) => tier.name === rankProgress.currentTier.name)
  const announcementPreview = [...announcements].sort((a, b) => Number(a.isRead) - Number(b.isRead)).slice(0, 3)

  useEffect(() => {
    const scroller = rankScrollerRef.current
    if (!scroller) {
      return
    }

    scroller.scrollTo({ left: Math.max(0, activeRankIndex * 80 - 12), behavior: 'smooth' })
  }, [activeRankIndex, selectedClassId])

  const slideRanks = (direction: 'left' | 'right') => {
    rankScrollerRef.current?.scrollBy({
      left: direction === 'left' ? -168 : 168,
      behavior: 'smooth'
    })
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {user?.isFirstLogin ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Your account is using a temporary password. Go to Settings to change it before continuing.
        </section>
      ) : null}

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="space-y-3">
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Dashboard Overview</h3>
            <p className="mt-1 text-xs text-slate-500">
              {selectedClass ? `${selectedClass.subjectName} / ${selectedClass.section.name}` : 'No subject assigned'}
            </p>
          </div>
          <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm" onClick={() => setContextOpen((value) => !value)} title="Dashboard options">
            <MoreVertical size={16} />
          </button>
          {contextOpen ? (
            <div className="absolute right-0 top-11 z-20 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Subject</p>
              <select
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
              >
                {classes.length === 0 ? <option value="">No subjects</option> : null}
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.subjectName}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <StatCard compact label="Total" title="Total Recitations" value={loading ? '--' : String(dashboard?.stats.totalRecitations ?? 0)} detail="In selected subject" icon={<ListChecks size={18} />} />
          <StatCard compact label="Rank" title="Current Rank" value={loading ? '--' : dashboard?.stats.currentRank ? `#${dashboard.stats.currentRank}` : 'Unranked'} detail="Within your section" icon={<Award size={18} />} />
          <StatCard compact label="Month" title="Monthly Recitations" value={loading ? '--' : String(dashboard?.stats.thisMonth ?? 0)} detail="Recitations this month" icon={<CalendarDays size={18} />} />
          <StatCard compact label="Average" title="Average Participation" value={loading ? '--' : String(dashboard?.stats.classAverageParticipation ?? 0)} detail="Average recitations per student" icon={<ChartNoAxesColumn size={18} />} />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--school-blue)]">Class announcements</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Updates from your teacher</h3>
          </div>
          <div className="rounded-2xl bg-blue-50 p-2 text-[var(--school-blue)]">
            <Megaphone size={18} />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {announcementPreview.map((announcement) => (
            <article className="rounded-2xl border border-slate-200 px-4 py-3" key={announcement.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-2">
                  {!announcement.isRead ? <span className="h-2 w-2 rounded-full bg-[var(--school-blue)]" /> : null}
                  <h4 className="text-sm font-semibold text-slate-950">{announcement.title}</h4>
                </div>
                <span className="text-xs text-slate-500">{new Date(announcement.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.message}</p>
            </article>
          ))}
          {announcements.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No announcements for this subject yet.</p> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid min-w-0 gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-b border-slate-200 bg-white p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--school-blue)]">Recitation Rank</p>
            <div className="mt-6 flex items-center gap-4">
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] bg-gradient-to-br ${rankProgress.currentTier.tone} shadow-sm ring-1 ring-slate-200`}>
                <ShieldCheck className={rankProgress.currentTier.iconTone} size={38} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-2xl font-semibold text-slate-950">{rankProgress.currentTier.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{totalRecitations} recitations in this subject</p>
              </div>
            </div>
            <p className="mt-5 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-[var(--school-blue)]">
              {rankProgress.nextTier ? `${rankProgress.remaining} more to reach ${rankProgress.nextTier.name}.` : 'Highest rank reached for this ladder.'}
            </p>
          </div>

          <div className="min-w-0 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Rank Progress</h3>
                <p className="mt-1 max-w-sm text-sm leading-5 text-slate-500">Based on recitations in this subject.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[var(--school-blue)]">
                <Sparkles size={14} />
                {dashboard?.stats.currentRank ? `Class rank #${dashboard.stats.currentRank}` : 'Unranked'}
              </span>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>{rankProgress.currentTier.name}</span>
                <span>{rankProgress.nextTier?.name ?? 'Complete'}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[var(--school-blue)] transition-all" style={{ width: `${rankProgress.progress}%` }} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rank ladder</p>
              <div className="flex gap-2">
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600" type="button" onClick={() => slideRanks('left')} title="Slide ranks left">
                  <ChevronLeft size={16} />
                </button>
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600" type="button" onClick={() => slideRanks('right')} title="Slide ranks right">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div ref={rankScrollerRef} className="mt-3 max-w-full overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max snap-x snap-mandatory gap-2">
              {rankTiers.map((tier) => {
                const unlocked = totalRecitations >= tier.min
                const active = tier.name === rankProgress.currentTier.name
                return (
                  <div className={`w-[72px] shrink-0 snap-start rounded-2xl border px-2 py-3 text-center sm:w-24 ${active ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'} ${!unlocked ? 'opacity-50' : ''}`} key={tier.name}>
                    <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br ${tier.tone} sm:h-9 sm:w-9`}>
                      <ShieldCheck className={tier.iconTone} size={16} />
                    </div>
                    <p className="mt-2 truncate text-[9px] font-semibold text-slate-900 sm:text-[10px]">{tier.name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{tier.min}+</p>
                  </div>
                )
              })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr] xl:gap-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h3 className="text-lg font-semibold">Recent History</h3>
          <div className="mt-6 space-y-3">
            {dashboard?.recentRecitations.map((recitation) => (
              <div className="rounded-2xl border border-slate-200 px-4 py-4" key={recitation.id}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{recitation.remarks ?? recitation.class.subjectName}</span>
                  <span className="text-[var(--school-blue)]">+{recitation.points}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{new Date(recitation.recitationDate).toLocaleDateString()}</p>
              </div>
            ))}
            {!dashboard?.recentRecitations.length ? <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">No recitations yet for this subject.</p> : null}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h3 className="text-lg font-semibold">Account Status</h3>
          <p className={`mt-4 rounded-2xl px-4 py-4 text-sm ${user?.isFirstLogin ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {user?.isFirstLogin ? 'Temporary password active' : 'Password updated'}
          </p>
        </div>
      </section>
    </div>
  )
}
