import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertCircle, Medal, MoreVertical, TrendingUp, Users } from 'lucide-react'
import { StateMessage } from '../../components/common/state-message'
import { StatCard } from '../../components/dashboard/stat-card'
import { useAuth } from '../../lib/use-auth'
import { getClasses, getClassReport } from '../../services/teacher'
import type { ClassReport, TeacherClass } from '../../types/teacher'

export function AnalyticsPage() {
  const { accessToken } = useAuth()
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [report, setReport] = useState<ClassReport | null>(null)
  const [contextOpen, setContextOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        setSelectedClassId(classList[0]?.id ?? '')
      } catch {
        setError('Unable to load analytics.')
      } finally {
        setLoading(false)
      }
    }

    void loadClasses()
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !selectedClassId) {
      setReport(null)
      return
    }

    const loadReport = async () => {
      try {
        setError('')
        setReport(await getClassReport(accessToken, selectedClassId))
      } catch {
        setError('Unable to load class analytics.')
      }
    }

    void loadReport()
  }, [accessToken, selectedClassId])

  return (
    <div className="space-y-5 sm:space-y-6">
      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={18} />
          {error}
        </div>
      ) : null}

      {!loading && classes.length === 0 ? (
        <StateMessage
          title="No classes to analyze yet"
          description="Analytics appear after you create a class and start recording student recitations."
        />
      ) : null}

      <section className="space-y-3">
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Analytics Overview</h3>
            <p className="mt-1 text-xs text-slate-500">
              {report ? `${report.class.subjectName} / ${report.class.section.name}` : 'Select a class'}
            </p>
          </div>
          <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm" onClick={() => setContextOpen((value) => !value)} title="Analytics options">
            <MoreVertical size={16} />
          </button>
          {contextOpen ? (
            <div className="absolute right-0 top-11 z-20 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Class</p>
              <select className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
                {classes.length === 0 ? <option value="">No classes</option> : null}
                {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.subjectName} / {cls.section.name}</option>)}
              </select>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <StatCard compact label="Students" title="Total Students" value={loading ? '--' : String(report?.stats.totalStudents ?? 0)} detail="Selected class roster" icon={<Users size={18} />} />
          <StatCard compact label="Records" title="Total Recitations" value={loading ? '--' : String(report?.stats.totalRecitations ?? 0)} detail="Within selected class" icon={<Activity size={18} />} />
          <StatCard compact label="Rate" title="Participation Rate" value={loading ? '--' : `${report?.stats.participationRate ?? 0}%`} detail="Students with at least one record" icon={<TrendingUp size={18} />} />
          <StatCard compact label="Inactive" title="Inactive Students" value={loading ? '--' : String(report?.stats.inactiveStudents ?? 0)} detail="No records yet" icon={<Medal size={18} />} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr] xl:gap-6">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold">Daily Recitation Trend</h3>
            <p className="mt-1 text-sm text-slate-500">Records logged over time for the selected class.</p>
          </div>
          {report?.dailyTrend.length ? (
            <div className="mt-5 h-64 min-w-0 sm:h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <LineChart data={report.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="recitations" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6">
              <StateMessage title="No trend data yet" description="Daily trends will appear after recitations are recorded for the selected class." />
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold">Top Students</h3>
            <p className="mt-1 text-sm text-slate-500">Ranked by recitation count in this class.</p>
          </div>
          {report?.topStudents.length ? (
            <>
            <div className="mt-5 space-y-3 md:hidden">
              {report.topStudents.slice(0, 5).map((student) => (
                <div className="rounded-2xl border border-slate-200 px-4 py-3" key={student.studentId}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">#{student.rank} {student.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{student.studentNumber}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-[var(--school-blue)]">{student.recitations}</p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Records</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[var(--school-blue)]" style={{ width: `${Math.min(100, (student.recitations / Math.max(1, report.topStudents[0]?.recitations ?? 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 hidden h-72 min-w-0 md:block">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                <BarChart data={report.topStudents} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="recitations" fill="#2563eb" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            </>
          ) : (
            <div className="mt-6">
              <StateMessage title="No ranking data yet" description="Top students will appear once the selected class has recitation records." />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div>
          <h3 className="text-lg font-semibold">Needs Attention</h3>
          <p className="mt-1 text-sm text-slate-500">Students with no recorded recitation in this class yet.</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {report?.inactiveStudents.map((student) => (
            <div className="rounded-2xl border border-slate-200 px-4 py-3" key={student.studentId}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-500">{student.studentNumber}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">0</span>
              </div>
            </div>
          ))}
          {!report?.inactiveStudents.length ? <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">Every student has at least one recitation in this class.</p> : null}
        </div>
      </section>
    </div>
  )
}
