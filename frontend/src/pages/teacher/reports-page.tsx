import { useEffect, useState } from 'react'
import { Download, FileText, MoreVertical, Search } from 'lucide-react'
import { StateMessage } from '../../components/common/state-message'
import { useAuth } from '../../lib/use-auth'
import { getClasses, getClassReport, getStudentReport } from '../../services/teacher'
import type { ClassReport, StudentReport, TeacherClass } from '../../types/teacher'

const csvCell = (value: string | number | null | undefined) => {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

const filenamePart = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'report'

export function ReportsPage() {
  const { accessToken } = useAuth()
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [report, setReport] = useState<ClassReport | null>(null)
  const [studentReport, setStudentReport] = useState<StudentReport | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [contextOpen, setContextOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = async (classId = selectedClassId) => {
    if (!accessToken || !classId) {
      return
    }

    try {
      setError('')
      setReport(await getClassReport(accessToken, classId, { startDate: startDate || undefined, endDate: endDate || undefined }))
      setStudentReport(null)
    } catch {
      setError('Unable to load report.')
    }
  }

  useEffect(() => {
    if (!accessToken) {
      return
    }

    const loadClasses = async () => {
      try {
        setLoading(true)
        setError('')
        const classList = await getClasses(accessToken)
        setClasses(classList)
        const firstClassId = classList[0]?.id ?? ''
        setSelectedClassId(firstClassId)
        if (firstClassId) {
          setReport(await getClassReport(accessToken, firstClassId))
        }
      } catch {
        setError('Unable to load reports.')
      } finally {
        setLoading(false)
      }
    }

    void loadClasses()
  }, [accessToken])

  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId)
    await loadReport(classId)
  }

  const handleStudentSelect = async (studentId: string) => {
    if (!accessToken || !selectedClassId) {
      return
    }

    try {
      setStudentReport(await getStudentReport(accessToken, studentId, {
        classId: selectedClassId,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }))
    } catch {
      setError('Unable to load student report.')
    }
  }

  const rows = (report?.students ?? []).filter((student) => {
    const query = search.trim().toLowerCase()
    return !query || `${student.name} ${student.studentNumber}`.toLowerCase().includes(query)
  })

  const downloadClassReportCsv = () => {
    if (!report) {
      return
    }

    const csvRows = [
      ['Class', report.class.subjectName],
      ['Section', report.class.section.name],
      ['Start Date', startDate || 'All'],
      ['End Date', endDate || 'All'],
      [],
      ['Rank', 'Student Number', 'Student Name', 'Recitations', 'Points', 'Last Recitation'],
      ...rows.map((student) => [
        student.rank,
        student.studentNumber,
        student.name,
        student.recitations,
        student.points,
        student.lastRecitationDate ? new Date(student.lastRecitationDate).toLocaleDateString() : 'None'
      ])
    ]

    const csv = csvRows.map((row) => row.map(csvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `recitrack-${filenamePart(report.class.subjectName)}-${filenamePart(report.class.section.name)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {!loading && classes.length === 0 ? (
        <StateMessage title="No reports available yet" description="Create a class and record recitations before exporting reports." />
      ) : null}

      <section className="space-y-3">
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Report Overview</h3>
            <p className="mt-1 text-xs text-slate-500">
              {report ? `${report.class.subjectName} / ${report.class.section.name}` : 'Select a class'}
            </p>
          </div>
          <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm" onClick={() => setContextOpen((value) => !value)} title="Report options">
            <MoreVertical size={16} />
          </button>
          {contextOpen ? (
            <div className="absolute right-0 top-11 z-20 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Filters</p>
              <div className="mt-3 space-y-2">
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" value={selectedClassId} onChange={(event) => void handleClassChange(event.target.value)}>
                  {classes.length === 0 ? <option value="">No classes</option> : null}
                  {classes.map((cls) => <option value={cls.id} key={cls.id}>{cls.subjectName} / {cls.section.name}</option>)}
                </select>
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                <button className="w-full rounded-xl bg-[var(--school-blue)] px-3 py-2.5 text-sm font-semibold text-white" onClick={() => void loadReport()}>
                  Apply Filters
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          ['Students', loading ? '--' : report?.stats.totalStudents ?? 0],
          ['Records', loading ? '--' : report?.stats.totalRecitations ?? 0],
          ['Points', loading ? '--' : report?.stats.totalPoints ?? 0],
          ['Rate', loading ? '--' : `${report?.stats.participationRate ?? 0}%`]
        ].map(([label, value]) => (
          <div className="flex min-h-[104px] flex-col items-center justify-center rounded-2xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-100 sm:min-h-[122px] sm:rounded-3xl sm:px-3 sm:py-4" key={label}>
            <p className="max-w-full truncate text-base font-semibold leading-tight text-slate-950 sm:text-lg">{value}</p>
            <p className="mt-1.5 max-w-full truncate text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:mt-2 sm:text-[9px] sm:tracking-[0.18em]">{label}</p>
          </div>
        ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px] xl:gap-6">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[var(--school-blue)]" />
              <h3 className="text-lg font-semibold">Class Report</h3>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student" />
              </label>
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-[var(--school-blue)] disabled:cursor-not-allowed disabled:opacity-50" onClick={downloadClassReportCsv} disabled={!report || rows.length === 0}>
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {rows.map((student) => (
              <button
                className="grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 px-4 py-4 text-left hover:bg-slate-50"
                key={student.studentId}
                onClick={() => void handleStudentSelect(student.studentId)}
              >
                <span className="text-sm font-semibold text-[var(--school-blue)]">#{student.rank}</span>
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold text-slate-900">{student.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{student.studentNumber}</span>
                  <span className="mt-2 block text-xs text-slate-500">Last: {student.lastRecitationDate ? new Date(student.lastRecitationDate).toLocaleDateString() : 'None'}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold text-slate-900">{student.recitations}</span>
                  <span className="block text-xs text-slate-500">recitations</span>
                  <span className="mt-2 block text-sm font-semibold text-[var(--school-blue)]">{student.points} pts</span>
                </span>
              </button>
            ))}
            {!rows.length ? (
              <div className="p-4">
                <StateMessage title="No report rows found" description="Try another class, date range, or search term." />
              </div>
            ) : null}
          </div>

          <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Recitations</th>
                <th className="px-4 py-3 font-medium">Points</th>
                <th className="px-4 py-3 font-medium">Last Recitation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {rows.map((student) => (
                <tr className="cursor-pointer hover:bg-slate-50" key={student.studentId} onClick={() => void handleStudentSelect(student.studentId)}>
                  <td className="px-4 py-3">#{student.rank}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.studentNumber}</p>
                  </td>
                  <td className="px-4 py-3">{student.recitations}</td>
                  <td className="px-4 py-3">{student.points}</td>
                  <td className="px-4 py-3">{student.lastRecitationDate ? new Date(student.lastRecitationDate).toLocaleDateString() : 'None'}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td className="px-4 py-6" colSpan={5}>
                    <StateMessage title="No report rows found" description="Try another class, date range, or search term." />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </div>

        <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h3 className="text-lg font-semibold">Student Detail</h3>
          {studentReport ? (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xl font-semibold">{studentReport.student.firstName} {studentReport.student.lastName}</p>
                <p className="text-sm text-slate-500">{studentReport.student.studentNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">Records</p>
                  <p className="mt-1 text-xl font-semibold">{studentReport.stats.totalRecitations}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">Points</p>
                  <p className="mt-1 text-xl font-semibold">{studentReport.stats.totalPoints}</p>
                </div>
              </div>
              <div className="space-y-3">
                {studentReport.recitations.slice(0, 6).map((recitation) => (
                  <div className="rounded-2xl border border-slate-200 px-4 py-3" key={recitation.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">+{recitation.points}</p>
                      <p className="text-xs text-slate-500">{new Date(recitation.recitationDate).toLocaleDateString()}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{recitation.remarks ?? recitation.class.subjectName}</p>
                  </div>
                ))}
                {!studentReport.recitations.length ? <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No student records for this filter.</p> : null}
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">Select a student row to view details.</p>
          )}
        </aside>
      </section>
    </div>
  )
}
