import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ListChecks, Search, Trophy } from 'lucide-react'
import { StateMessage } from '../../components/common/state-message'
import { useAuth } from '../../lib/use-auth'
import { getMyClasses, getMyRecitations } from '../../services/student'
import type { StudentClass, StudentRecitation } from '../../types/student'

export function StudentHistoryPage() {
  const { accessToken } = useAuth()
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [recitations, setRecitations] = useState<StudentRecitation[]>([])
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
        setRecitations(await getMyRecitations(accessToken, firstClassId || undefined))
      } catch {
        setError('Unable to load recitation history.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [accessToken])

  const handleClassChange = async (classId: string) => {
    if (!accessToken) {
      return
    }

    setSelectedClassId(classId)
    setRecitations(await getMyRecitations(accessToken, classId || undefined))
  }

  const filteredRecitations = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return recitations
    }

    return recitations.filter((recitation) => `${recitation.class.subjectName} ${recitation.remarks ?? ''}`.toLowerCase().includes(query))
  }, [recitations, search])
  const selectedClass = classes.find((cls) => cls.id === selectedClassId)
  const totalPoints = filteredRecitations.reduce((sum, recitation) => sum + recitation.points, 0)
  const thisMonthCount = filteredRecitations.filter((recitation) => {
    const date = new Date(recitation.recitationDate)
    const now = new Date()
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  }).length

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-[var(--school-blue)]">Your records</p>
          <h2 className="mt-1 text-3xl font-semibold text-slate-900">Recitation History</h2>
          <p className="mt-2 text-sm text-slate-500">{selectedClass ? `${selectedClass.subjectName} / ${selectedClass.section.name}` : 'Only your own recitation records are shown here.'}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
          <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700" value={selectedClassId} onChange={(event) => void handleClassChange(event.target.value)}>
            <option value="">All subjects</option>
            {classes.map((cls) => <option value={cls.id} key={cls.id}>{cls.subjectName}</option>)}
          </select>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search history" />
          </label>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryCard label="Records" value={String(filteredRecitations.length)} icon={<ListChecks size={18} />} />
        <SummaryCard label="This Month" value={String(thisMonthCount)} icon={<CalendarDays size={18} />} />
        <SummaryCard label="Points" value={String(totalPoints)} icon={<Trophy size={18} />} />
      </section>

      <section className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredRecitations.map((recitation) => (
            <article className="p-4" key={recitation.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{recitation.class.subjectName}</p>
                  <p className="mt-1 text-xs text-slate-500">{recitation.class.section.name}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[var(--school-blue)]">+{recitation.points}</span>
              </div>
              <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-700">{recitation.remarks ?? 'No remarks'}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <CalendarDays size={14} />
                {new Date(recitation.recitationDate).toLocaleDateString()}
              </div>
            </article>
          ))}
          {!loading && filteredRecitations.length === 0 ? (
            <div className="p-4">
              <StateMessage
                title={recitations.length === 0 ? 'No recitations yet' : 'No matching records'}
                description={recitations.length === 0 ? 'Your recitation history will appear here after your teacher records participation.' : 'Try another subject or search term.'}
              />
            </div>
          ) : null}
          {loading ? <p className="px-4 py-8 text-center text-sm text-slate-500">Loading history...</p> : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Section</th>
              <th className="px-4 py-3 font-medium">Points</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {filteredRecitations.map((recitation) => (
              <tr key={recitation.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{recitation.class.subjectName}</td>
                <td className="px-4 py-3">{recitation.class.section.name}</td>
                <td className="px-4 py-3 font-semibold text-[var(--school-blue)]">+{recitation.points}</td>
                <td className="px-4 py-3">{recitation.remarks ?? 'No remarks'}</td>
                <td className="px-4 py-3">{new Date(recitation.recitationDate).toLocaleDateString()}</td>
              </tr>
            ))}
            {!loading && filteredRecitations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6">
                  <StateMessage
                    title={recitations.length === 0 ? 'No recitations yet' : 'No matching records'}
                    description={recitations.length === 0 ? 'Your recitation history will appear here after your teacher records participation.' : 'Try another subject or search term.'}
                  />
                </td>
              </tr>
            ) : null}
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading history...</td>
              </tr>
            ) : null}
          </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-4">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[var(--school-blue)]">
        {icon}
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-950 sm:text-2xl">{value}</p>
      <p className="mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]">{label}</p>
    </div>
  )
}
