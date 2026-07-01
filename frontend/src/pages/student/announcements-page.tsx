import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Megaphone, Search } from 'lucide-react'
import { StateMessage } from '../../components/common/state-message'
import { useAuth } from '../../lib/use-auth'
import { getMyAnnouncements, getMyClasses, markMyAnnouncementsRead } from '../../services/student'
import type { StudentAnnouncement, StudentClass } from '../../types/student'

const announcementTypeLabels: Record<StudentAnnouncement['type'], string> = {
  NORMAL: 'Normal',
  IMPORTANT: 'Important',
  REMINDER: 'Reminder',
  ASSIGNMENT: 'Assignment'
}

const announcementTypeStyles: Record<StudentAnnouncement['type'], string> = {
  NORMAL: 'bg-slate-100 text-slate-600',
  IMPORTANT: 'bg-blue-50 text-[var(--school-blue)]',
  REMINDER: 'bg-cyan-50 text-cyan-700',
  ASSIGNMENT: 'bg-indigo-50 text-indigo-700'
}

export function StudentAnnouncementsPage() {
  const { accessToken } = useAuth()
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!accessToken) {
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError('')
        const classList = await getMyClasses(accessToken)
        setClasses(classList)
        const firstClassId = classList[0]?.id ?? ''
        setSelectedClassId(firstClassId)
        if (firstClassId) {
          const announcementList = await getMyAnnouncements(accessToken, firstClassId)
          setAnnouncements(announcementList)
          await markUnreadAsRead(firstClassId, announcementList)
        } else {
          setAnnouncements([])
        }
      } catch {
        setError('Unable to load announcements.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [accessToken])

  const markUnreadAsRead = async (classId: string, announcementList: StudentAnnouncement[]) => {
    if (!accessToken) {
      return
    }

    const unreadIds = announcementList.filter((announcement) => !announcement.isRead).map((announcement) => announcement.id)
    if (unreadIds.length === 0) {
      return
    }

    await markMyAnnouncementsRead(accessToken, { classId, announcementIds: unreadIds })
    setAnnouncements((current) => current.map((announcement) => unreadIds.includes(announcement.id) ? { ...announcement, isRead: true, readAt: new Date().toISOString() } : announcement))
    window.dispatchEvent(new Event('recitrack:announcements-read'))
  }

  const handleClassChange = async (classId: string) => {
    if (!accessToken) {
      return
    }

    try {
      setLoading(true)
      setError('')
      setSelectedClassId(classId)
      if (classId) {
        const announcementList = await getMyAnnouncements(accessToken, classId)
        setAnnouncements(announcementList)
        await markUnreadAsRead(classId, announcementList)
      } else {
        setAnnouncements([])
      }
    } catch {
      setError('Unable to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return announcements
    }

    return announcements.filter((announcement) =>
      `${announcement.title} ${announcement.message} ${announcement.class.subjectName} ${announcement.section.name}`.toLowerCase().includes(query)
    )
  }, [announcements, search])

  const selectedClass = classes.find((cls) => cls.id === selectedClassId)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-[var(--school-blue)]">Teacher updates</p>
          <h2 className="mt-1 text-3xl font-semibold text-slate-900">Announcements</h2>
          <p className="mt-2 text-sm text-slate-500">
            {selectedClass ? `${selectedClass.subjectName} / ${selectedClass.section.name}` : 'Announcements are shown per enrolled subject.'}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[560px]">
          <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700" value={selectedClassId} onChange={(event) => void handleClassChange(event.target.value)}>
            {classes.length === 0 ? <option value="">No subjects</option> : null}
            {classes.map((cls) => (
              <option value={cls.id} key={cls.id}>{cls.subjectName} / {cls.section.name}</option>
            ))}
          </select>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search announcements" />
          </label>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Class Announcements</h3>
            <p className="mt-1 text-xs text-slate-500">{filteredAnnouncements.length} update{filteredAnnouncements.length === 1 ? '' : 's'} for this subject</p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-2 text-[var(--school-blue)]">
            <Megaphone size={18} />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredAnnouncements.map((announcement) => (
            <article className="p-5" key={announcement.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--school-blue)]">{announcement.class.subjectName}</p>
                  <h4 className="mt-1 text-lg font-semibold text-slate-950">{announcement.title}</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!announcement.isRead ? (
                      <span className="rounded-full bg-[var(--school-blue)] px-2.5 py-1 text-[11px] font-semibold text-white">Unread</span>
                    ) : null}
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${announcementTypeStyles[announcement.type]}`}>
                      {announcementTypeLabels[announcement.type]}
                    </span>
                    {announcement.expiresAt ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                        Until {new Date(announcement.expiresAt).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays size={14} />
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">{announcement.message}</p>
            </article>
          ))}

          {!loading && filteredAnnouncements.length === 0 ? (
            <div className="p-5">
              <StateMessage
                title={announcements.length === 0 ? 'No announcements yet' : 'No matching announcements'}
                description={announcements.length === 0 ? 'Your teacher announcements for this subject will appear here.' : 'Try another search term.'}
              />
            </div>
          ) : null}

          {loading ? <p className="px-5 py-10 text-center text-sm text-slate-500">Loading announcements...</p> : null}
        </div>
      </section>
    </div>
  )
}
