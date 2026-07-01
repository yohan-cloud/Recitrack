import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertCircle, Medal, MoreVertical, Users, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StateMessage } from '../../components/common/state-message'
import { StatCard } from '../../components/dashboard/stat-card'
import { useAuth } from '../../lib/use-auth'
import { getClassDashboard, getClasses, getSections } from '../../services/teacher'
import type { ClassDashboard, Section, TeacherClass } from '../../types/teacher'

export function TeacherDashboardPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [sections, setSections] = useState<Section[]>([])
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [dashboard, setDashboard] = useState<ClassDashboard | null>(null)
  const [contextOpen, setContextOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!accessToken) {
      return
    }

    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError('')
        const [sectionList, classList] = await Promise.all([getSections(accessToken), getClasses(accessToken)])
        setSections(sectionList)
        setClasses(classList)
        setSelectedSectionId(sectionList[0]?.id ?? '')
        setSelectedClassId(classList[0]?.id ?? '')
      } catch {
        setError('Unable to load teacher dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    void loadInitialData()
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !selectedClassId) {
      setDashboard(null)
      return
    }

    const loadDashboard = async () => {
      try {
        setError('')
        setDashboard(await getClassDashboard(accessToken, selectedClassId))
      } catch {
        setError('Unable to load selected class summary.')
      }
    }

    void loadDashboard()
  }, [accessToken, selectedClassId])

  const visibleClasses = useMemo(() => {
    if (!selectedSectionId) {
      return classes
    }

    return classes.filter((cls) => cls.sectionId === selectedSectionId)
  }, [classes, selectedSectionId])

  const selectedClass = dashboard?.class ?? classes.find((cls) => cls.id === selectedClassId)
  const selectedSectionName = selectedClass?.section?.name ?? sections.find((section) => section.id === selectedClass?.sectionId)?.name
  const hasSetupData = sections.length > 0 && classes.length > 0

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId)
    const nextClass = classes.find((cls) => cls.sectionId === sectionId)
    setSelectedClassId(nextClass?.id ?? '')
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={18} />
          {error}
        </div>
      ) : null}

      {!loading && !hasSetupData ? (
        <StateMessage
          title="Set up your first class context"
          description="Create a section first, then create a class under that section. Dashboard stats will appear once a class exists."
          action={
            <button className="rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white" onClick={() => navigate('/teacher/sections')}>
              Create Section
            </button>
          }
        />
      ) : null}

      <section className="space-y-3">
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Dashboard Overview</h3>
            <p className="mt-1 text-xs text-slate-500">
              {selectedClass ? `${selectedClass.subjectName} / ${selectedSectionName ?? 'No section'}` : 'No class selected'}
            </p>
          </div>
          <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm" onClick={() => setContextOpen((value) => !value)} title="Dashboard options">
            <MoreVertical size={16} />
          </button>
          {contextOpen ? (
            <div className="absolute right-0 top-11 z-20 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Context</p>
              <div className="mt-3 space-y-2">
                <select
                  value={selectedSectionId}
                  onChange={(event) => handleSectionChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                >
                  {sections.length === 0 ? <option value="">No sections</option> : null}
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                >
                  {visibleClasses.length === 0 ? <option value="">No classes</option> : null}
                  {visibleClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.subjectName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <StatCard compact label="Students" title="Total Students" value={loading ? '--' : String(dashboard?.stats.totalStudents ?? 0)} detail="In selected class and section" icon={<Users size={18} />} />
          <StatCard compact label="Today" title="Today's Recitations" value={loading ? '--' : String(dashboard?.stats.todayRecitations ?? 0)} detail="Logged today" icon={<Zap size={18} />} />
          <StatCard compact label="Rate" title="Participation Rate" value={loading ? '--' : `${dashboard?.stats.participationRate ?? 0}%`} detail="Based on current roster" icon={<Activity size={18} />} />
          <StatCard
            compact
            label="Top"
            title="Most Active Student"
            value={loading ? '--' : dashboard?.stats.mostActiveStudent?.name ?? 'None yet'}
            detail={dashboard?.stats.mostActiveStudent ? `${dashboard.stats.mostActiveStudent.recitations} recitations` : 'No records yet'}
            icon={<Medal size={18} />}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr] xl:gap-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Recitation Summary</h3>
            <span className="text-sm text-slate-500">Latest records</span>
          </div>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {dashboard?.recentRecitations.length ? (
                  dashboard.recentRecitations.map((recitation) => (
                    <tr key={recitation.id}>
                      <td className="px-4 py-3">{recitation.student.firstName} {recitation.student.lastName}</td>
                      <td className="px-4 py-3">+{recitation.points}</td>
                      <td className="px-4 py-3">{recitation.remarks ?? 'No remarks'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>No recitations logged for this class yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-6">
          <h3 className="text-base font-semibold sm:text-lg">Quick Actions</h3>
          <div className="mt-4 grid gap-2 sm:mt-6 sm:gap-3">
            <button
              className="rounded-xl bg-[var(--school-blue)] px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-4 sm:py-3"
              disabled={!selectedClassId}
              onClick={() => navigate(`/teacher/classes/${selectedClassId}`)}
            >
              Open Class Details
            </button>
            <button className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 sm:rounded-2xl sm:px-4 sm:py-3" onClick={() => navigate('/teacher/students')}>Manage Students</button>
            <button className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 sm:rounded-2xl sm:px-4 sm:py-3" onClick={() => navigate('/teacher/reports')}>View Reports</button>
          </div>
        </div>
      </section>
    </div>
  )
}
