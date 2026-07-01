import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Dice5, Minus, Pencil, Plus, Search, X } from 'lucide-react'
import { useAuth } from '../../lib/use-auth'
import { addRecitation, deleteRecitation, getClassDetails, getClassRecitations } from '../../services/teacher'
import type { ClassDetails, Recitation } from '../../types/teacher'

function isToday(value: string) {
  const date = new Date(value)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function ClassDetailsPage() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [recitations, setRecitations] = useState<Recitation[]>([])
  const [search, setSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerBusy, setPickerBusy] = useState(false)
  const [pickerDisplayStudentId, setPickerDisplayStudentId] = useState('')
  const [editingCountStudentId, setEditingCountStudentId] = useState('')
  const [editingCountValue, setEditingCountValue] = useState(0)
  const [changedStudentId, setChangedStudentId] = useState('')
  const [toast, setToast] = useState<null | {
    id: number
    message: string
  }>(null)
  const [loading, setLoading] = useState(true)
  const [busyStudentId, setBusyStudentId] = useState('')
  const [error, setError] = useState('')
  const pickerTimers = useRef<Array<ReturnType<typeof window.setTimeout> | ReturnType<typeof window.setInterval>>>([])
  const toastTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const animationTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const loadClassDetails = async () => {
    if (!accessToken || !classId) {
      return
    }

    try {
      setLoading(true)
      setError('')
      const [details, recitationList] = await Promise.all([
        getClassDetails(accessToken, classId),
        getClassRecitations(accessToken, classId)
      ])
      setClassDetails(details)
      setRecitations(recitationList)
    } catch {
      setError('Unable to load class details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadClassDetails()
  }, [accessToken, classId])

  useEffect(() => {
    return () => {
      pickerTimers.current.forEach((timer) => window.clearTimeout(timer))
      pickerTimers.current = []
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current)
      }
      if (animationTimer.current) {
        window.clearTimeout(animationTimer.current)
      }
    }
  }, [])

  const students = classDetails?.classStudents.map((entry) => entry.student) ?? []
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return students
    }

    return students.filter((student) =>
      `${student.firstName} ${student.lastName} ${student.studentNumber}`.toLowerCase().includes(query)
    )
  }, [search, students])

  const todayRecitations = useMemo(() => recitations.filter((recitation) => isToday(recitation.recitationDate)), [recitations])
  const selectedStudent = students.find((student) => student.id === selectedStudentId)
  const pickerDisplayStudent = students.find((student) => student.id === pickerDisplayStudentId) ?? selectedStudent

  const countTodayForStudent = (studentId: string) => todayRecitations.filter((recitation) => recitation.studentId === studentId).length
  const todayRecitationsForStudent = (studentId: string) => todayRecitations.filter((recitation) => recitation.studentId === studentId)

  const flashCount = (studentId: string) => {
    setChangedStudentId(studentId)
    if (animationTimer.current) {
      window.clearTimeout(animationTimer.current)
    }
    animationTimer.current = window.setTimeout(() => setChangedStudentId(''), 260)
  }

  const showToast = (message: string) => {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current)
    }
    setToast({ id: Date.now(), message })
    toastTimer.current = window.setTimeout(() => setToast(null), 6500)
  }

  const handleAddRecitation = async (studentId: string) => {
    if (!accessToken || !classId) {
      return
    }

    try {
      setBusyStudentId(studentId)
      const recitation = await addRecitation(accessToken, { classId, studentId, points: 1 })
      setRecitations((current) => [recitation, ...current])
      flashCount(studentId)
      const student = students.find((entry) => entry.id === studentId)
      showToast(`${student?.firstName ?? 'Student'} ${student?.lastName ?? ''} +1 Recitation`)
    } catch {
      setError('Unable to add recitation.')
    } finally {
      setBusyStudentId('')
    }
  }

  const handleRemoveRecitation = async (studentId: string) => {
    if (!accessToken || !classId || countTodayForStudent(studentId) === 0) {
      return
    }

    try {
      setBusyStudentId(studentId)
      const [recitation] = todayRecitationsForStudent(studentId)
      if (!recitation) {
        return
      }

      await deleteRecitation(accessToken, recitation.id)
      setRecitations((current) => current.filter((entry) => entry.id !== recitation.id))
      flashCount(studentId)
      const student = students.find((entry) => entry.id === studentId)
      showToast(`${student?.firstName ?? 'Student'} ${student?.lastName ?? ''} -1 Recitation`)
    } catch {
      setError('Unable to remove recitation.')
    } finally {
      setBusyStudentId('')
    }
  }

  const openEditCount = (studentId: string) => {
    setEditingCountStudentId(studentId)
    setEditingCountValue(countTodayForStudent(studentId))
  }

  const handleSaveCount = async () => {
    if (!accessToken || !classId || !editingCountStudentId) {
      return
    }

    const nextCount = Math.max(0, Number(editingCountValue) || 0)
    const previousCount = countTodayForStudent(editingCountStudentId)
    const diff = nextCount - previousCount
    const studentId = editingCountStudentId
    const student = students.find((entry) => entry.id === studentId)

    if (diff === 0) {
      setEditingCountStudentId('')
      return
    }

    try {
      setBusyStudentId(studentId)
      if (diff > 0) {
        const created: Recitation[] = []
        for (let index = 0; index < diff; index += 1) {
          created.push(await addRecitation(accessToken, { classId, studentId, points: 1 }))
        }
        setRecitations((current) => [...created, ...current])
        showToast(`${student?.firstName ?? 'Student'} ${student?.lastName ?? ''} count updated from ${previousCount} -> ${nextCount}`)
      } else {
        const toDelete = todayRecitationsForStudent(studentId).slice(0, Math.abs(diff))
        await Promise.all(toDelete.map((recitation) => deleteRecitation(accessToken, recitation.id)))
        setRecitations((current) => current.filter((entry) => !toDelete.some((recitation) => recitation.id === entry.id)))
        showToast(`${student?.firstName ?? 'Student'} ${student?.lastName ?? ''} count updated from ${previousCount} -> ${nextCount}`)
      }

      flashCount(studentId)
      setEditingCountStudentId('')
    } catch {
      setError('Unable to update today recitation count.')
    } finally {
      setBusyStudentId('')
    }
  }

  const handlePickRandom = () => {
    if (filteredStudents.length === 0) {
      return
    }

    pickerTimers.current.forEach((timer) => window.clearTimeout(timer))
    pickerTimers.current = []

    const nextStudent = filteredStudents[Math.floor(Math.random() * filteredStudents.length)]
    setPickerOpen(true)
    setPickerBusy(true)
    setPickerDisplayStudentId(filteredStudents[0]?.id ?? nextStudent.id)

    const cycleTimer = window.setInterval(() => {
      const cyclingStudent = filteredStudents[Math.floor(Math.random() * filteredStudents.length)]
      setPickerDisplayStudentId(cyclingStudent.id)
    }, 90)

    const stopTimer = window.setTimeout(() => {
      window.clearInterval(cycleTimer)
      setPickerDisplayStudentId(nextStudent.id)
      setSelectedStudentId(nextStudent.id)
      setPickerBusy(false)
    }, 2200)

    pickerTimers.current = [cycleTimer, stopTimer]
  }

  const closePicker = () => {
    pickerTimers.current.forEach((timer) => window.clearTimeout(timer))
    pickerTimers.current = []
    setPickerOpen(false)
    setPickerBusy(false)
  }

  if (loading) {
    return <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">Loading class details...</div>
  }

  return (
    <div className="-mt-3 space-y-5 sm:-mt-4 sm:space-y-6 lg:-mt-5">
      <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800" onClick={() => navigate('/teacher/dashboard')}>
        <ArrowLeft size={16} />
        Back to dashboard
      </button>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-[var(--school-blue)]">{classDetails?.section.gradeLevel} / {classDetails?.section.name}</p>
          <h2 className="mt-1 text-3xl font-semibold text-slate-900">{classDetails?.subjectName}</h2>
          <p className="mt-2 text-sm text-slate-500">{classDetails?.scheduleDay}, {classDetails?.scheduleTime}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60" onClick={handlePickRandom} disabled={filteredStudents.length === 0}>
            <Dice5 size={18} />
            Pick Random Student
          </button>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--school-blue)]">Total Recitations</p>
          <p className="mt-2 text-3xl font-semibold">{recitations.length}</p>
          <p className="mt-1 text-xs text-slate-500">All records in this class</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Today&apos;s Recitations</p>
          <p className="mt-3 text-3xl font-semibold">{todayRecitations.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Students Participated</p>
          <p className="mt-3 text-3xl font-semibold">{new Set(todayRecitations.map((recitation) => recitation.studentId)).size}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Selected Student</p>
          <p className="mt-3 text-xl font-semibold">{selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'None'}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold">Students</h3>
          <label className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none"
              placeholder="Search student"
            />
          </label>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 sm:mt-6">
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredStudents.map((student) => (
              <article className={selectedStudentId === student.id ? 'bg-blue-50 px-3 py-3' : 'px-3 py-3'} key={student.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{student.firstName} {student.lastName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{student.studentNumber}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-lg font-semibold leading-none text-slate-900 transition ${changedStudentId === student.id ? 'scale-125 text-[var(--school-blue)]' : 'scale-100'}`}>{countTodayForStudent(student.id)}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-slate-500">Today</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-[36px_1fr_36px_36px] items-center gap-2">
                  <button className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" title="Remove Recitation" disabled={countTodayForStudent(student.id) === 0 || busyStudentId === student.id} onClick={() => void handleRemoveRecitation(student.id)}>
                    <Minus size={14} />
                  </button>
                  <div className={`rounded-xl bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-900 transition ${changedStudentId === student.id ? 'scale-105 bg-blue-50 text-[var(--school-blue)]' : 'scale-100'}`}>{countTodayForStudent(student.id)}</div>
                  <button className="inline-flex h-9 items-center justify-center rounded-xl bg-[var(--school-blue)] text-white disabled:opacity-60" title="Add Recitation" disabled={busyStudentId === student.id} onClick={() => void handleAddRecitation(student.id)}>
                    <Plus size={14} />
                  </button>
                  <button className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600" title="Edit Count" onClick={() => openEditCount(student.id)}>
                    <Pencil size={14} />
                  </button>
                </div>
              </article>
            ))}
            {filteredStudents.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">No students found.</p> : null}
          </div>

          <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Student No.</th>
                <th className="px-4 py-3 font-medium">Today</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filteredStudents.map((student) => (
                <tr key={student.id} className={selectedStudentId === student.id ? 'bg-blue-50' : undefined}>
                  <td className="px-4 py-3 font-medium text-slate-900">{student.firstName} {student.lastName}</td>
                  <td className="px-4 py-3">{student.studentNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block transition ${changedStudentId === student.id ? 'scale-125 text-[var(--school-blue)]' : 'scale-100'}`}>{countTodayForStudent(student.id)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-grid grid-cols-[34px_44px_34px_34px] items-center gap-2">
                      <button className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" title="Remove Recitation" disabled={countTodayForStudent(student.id) === 0 || busyStudentId === student.id} onClick={() => void handleRemoveRecitation(student.id)}>
                        <Minus size={14} />
                      </button>
                      <span className={`rounded-xl bg-slate-50 px-3 py-2 text-center font-semibold transition ${changedStudentId === student.id ? 'scale-105 bg-blue-50 text-[var(--school-blue)]' : 'scale-100'}`}>{countTodayForStudent(student.id)}</span>
                      <button className="inline-flex h-9 items-center justify-center rounded-xl bg-[var(--school-blue)] text-white disabled:opacity-60" title="Add Recitation" disabled={busyStudentId === student.id} onClick={() => void handleAddRecitation(student.id)}>
                        <Plus size={14} />
                      </button>
                      <button className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600" title="Edit Count" onClick={() => openEditCount(student.id)}>
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No students found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold">Today&apos;s Summary</h3>
        <div className="mt-5 space-y-3">
          {todayRecitations.slice(0, 8).map((recitation) => (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3" key={recitation.id}>
              <div>
                <p className="font-medium text-slate-900">{recitation.student.firstName} {recitation.student.lastName}</p>
                <p className="text-sm text-slate-500">{new Date(recitation.recitationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[var(--school-blue)]">+{recitation.points}</span>
            </div>
          ))}
          {todayRecitations.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">No recitations yet today.</p> : null}
        </div>
      </section>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-md">
          <section className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-indigo-100/90 p-8 text-center shadow-2xl ring-1 ring-white/60">
            <button
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-slate-500 shadow-sm transition hover:text-slate-900"
              onClick={closePicker}
              aria-label="Close random picker"
            >
              <X size={18} />
            </button>

            <div className="relative mx-auto mt-6 flex h-36 w-36 items-center justify-center">
              <div className={pickerBusy ? 'random-picker-ring is-spinning' : 'random-picker-ring'} />
              <div className="absolute h-12 w-12 rounded-full border-4 border-[var(--school-blue)] border-b-transparent bg-white/80" />
            </div>

            <div className="mt-2 flex justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--school-blue)] random-picker-dot" />
              <span className="h-2 w-2 rounded-full bg-[var(--school-blue)] random-picker-dot [animation-delay:120ms]" />
              <span className="h-2 w-2 rounded-full bg-[var(--school-blue)] random-picker-dot [animation-delay:240ms]" />
            </div>

            <div className="mx-auto mt-8 max-w-sm rounded-3xl bg-white/35 px-6 py-6 shadow-lg ring-1 ring-white/50">
              <p className={pickerBusy ? 'truncate text-4xl font-bold text-white blur-sm transition' : 'truncate text-4xl font-bold text-white drop-shadow-sm transition'}>
                {pickerDisplayStudent ? `${pickerDisplayStudent.firstName} ${pickerDisplayStudent.lastName}` : 'No student'}
              </p>
              {!pickerBusy && pickerDisplayStudent ? <p className="mt-2 text-sm font-medium text-slate-500">{pickerDisplayStudent.studentNumber}</p> : null}
            </div>

            {!pickerBusy && pickerDisplayStudent ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--school-blue)] px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busyStudentId === pickerDisplayStudent.id}
                  onClick={() => void handleAddRecitation(pickerDisplayStudent.id)}
                >
                  <Plus size={16} />
                  +1 Recitation
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm" onClick={handlePickRandom}>
                  <Dice5 size={16} />
                  Pick Again
                </button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {editingCountStudentId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold">Edit Today&apos;s Recitations</h3>
            <div className="mt-5 grid grid-cols-[40px_1fr_40px] items-center gap-2">
              <button className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700" onClick={() => setEditingCountValue((value) => Math.max(0, value - 1))}>
                <Minus size={16} />
              </button>
              <input className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-center text-sm font-semibold outline-none" type="number" min={0} value={editingCountValue} onChange={(event) => setEditingCountValue(Math.max(0, Number(event.target.value) || 0))} />
              <button className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--school-blue)] text-white" onClick={() => setEditingCountValue((value) => value + 1)}>
                <Plus size={16} />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700" onClick={() => setEditingCountStudentId('')}>
                Cancel
              </button>
              <button className="rounded-xl bg-[var(--school-blue)] px-3 py-2.5 text-sm font-semibold text-white" onClick={() => void handleSaveCount()}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100%-2rem)] max-w-sm animate-[toast-slide-in_180ms_ease-out] rounded-2xl border border-blue-400 bg-[var(--school-blue)] p-4 text-white shadow-2xl shadow-blue-900/30 ring-1 ring-blue-200 lg:bottom-6">
          <div className="mb-3 h-1 w-10 rounded-full bg-white/80" />
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      ) : null}
    </div>
  )
}
