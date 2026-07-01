import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Copy, MoreVertical, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { ConfirmDialog } from '../../components/common/confirm-dialog'
import { StateMessage } from '../../components/common/state-message'
import { useAuth } from '../../lib/use-auth'
import { createStudent, deleteStudent, getClasses, getSections, getStudents, updateStudent } from '../../services/teacher'
import type { Section, StudentCreatePayload, TeacherClass, TeacherStudent } from '../../types/teacher'

type FormState = StudentCreatePayload

const blankForm: FormState = {
  username: '',
  studentNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  sectionId: '',
  classIds: []
}

export function StudentManagementPage() {
  const { accessToken } = useAuth()
  const [sections, setSections] = useState<Section[]>([])
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [students, setStudents] = useState<TeacherStudent[]>([])
  const [search, setSearch] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [form, setForm] = useState<FormState>(blankForm)
  const [editingStudentId, setEditingStudentId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [openMenuStudentId, setOpenMenuStudentId] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TeacherStudent | null>(null)
  const [error, setError] = useState('')

  const loadData = async () => {
    if (!accessToken) {
      return
    }

    try {
      setLoading(true)
      setError('')
      const [sectionList, classList, studentList] = await Promise.all([
        getSections(accessToken),
        getClasses(accessToken),
        getStudents(accessToken)
      ])
      setSections(sectionList)
      setClasses(classList)
      setStudents(studentList)
      setForm((current) => ({ ...current, sectionId: current.sectionId || sectionList[0]?.id || '' }))
    } catch {
      setError('Unable to load student management data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [accessToken])

  const availableClasses = useMemo(
    () => classes.filter((cls) => !form.sectionId || cls.sectionId === form.sectionId),
    [classes, form.sectionId]
  )

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return students.filter((student) => {
      const matchesSearch = !query || `${student.firstName} ${student.lastName} ${student.studentNumber} ${student.user.username}`.toLowerCase().includes(query)
      const matchesSection = !sectionFilter || student.sectionId === sectionFilter
      const matchesClass = !classFilter || student.classStudents.some((entry) => entry.class.id === classFilter)
      return matchesSearch && matchesSection && matchesClass
    })
  }, [classFilter, search, sectionFilter, students])

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'sectionId') {
        next.classIds = []
      }
      return next
    })
  }

  const toggleClass = (classId: string) => {
    setForm((current) => ({
      ...current,
      classIds: current.classIds.includes(classId)
        ? current.classIds.filter((id) => id !== classId)
        : [...current.classIds, classId]
    }))
  }

  const resetForm = () => {
    setEditingStudentId('')
    setTemporaryPassword('')
    setFormOpen(false)
    setForm({ ...blankForm, sectionId: sections[0]?.id || '' })
  }

  const openCreateForm = () => {
    setEditingStudentId('')
    setTemporaryPassword('')
    setForm({ ...blankForm, sectionId: sections[0]?.id || '' })
    setFormOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!accessToken) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setTemporaryPassword('')

      if (editingStudentId) {
        await updateStudent(accessToken, editingStudentId, {
          studentNumber: form.studentNumber,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          sectionId: form.sectionId,
          classIds: form.classIds
        })
      } else {
        const result = await createStudent(accessToken, form)
        setTemporaryPassword(result.temporaryPassword)
      }

      await loadData()
      if (!editingStudentId) {
        setForm({ ...blankForm, sectionId: form.sectionId })
      }
      if (editingStudentId) {
        resetForm()
      }
    } catch {
      setError(editingStudentId ? 'Unable to update student.' : 'Unable to create student. Check username and student number.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (student: TeacherStudent) => {
    setOpenMenuStudentId('')
    setTemporaryPassword('')
    setEditingStudentId(student.id)
    setFormOpen(true)
    setForm({
      username: student.user.username,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email ?? '',
      sectionId: student.sectionId,
      classIds: student.classStudents.map((entry) => entry.class.id)
    })
  }

  const handleDelete = async () => {
    if (!accessToken || !deleteTarget) {
      return
    }

    try {
      setDeleting(true)
      setError('')
      setOpenMenuStudentId('')
      await deleteStudent(accessToken, deleteTarget.id)
      setStudents((current) => current.filter((entry) => entry.id !== deleteTarget.id))
      if (editingStudentId === deleteTarget.id) {
        resetForm()
      }
      setDeleteTarget(null)
    } catch {
      setError('Unable to delete student.')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (student: TeacherStudent) => {
    setOpenMenuStudentId('')
    setDeleteTarget(student)
  }

  const copyStudentUsername = async (student: TeacherStudent) => {
    await navigator.clipboard.writeText(student.user.username).catch(() => undefined)
    setOpenMenuStudentId('')
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs text-[var(--school-blue)] sm:text-sm">Teacher roster</p>
            <h2 className="mt-0.5 text-2xl font-semibold text-slate-900 sm:text-3xl">Student Management</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">Create student accounts and assign them to section classes.</p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-4 lg:gap-3">
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none sm:rounded-2xl sm:px-4 sm:py-3" value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
              <option value="">All sections</option>
              {sections.map((section) => <option value={section.id} key={section.id}>{section.name}</option>)}
            </select>
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none sm:rounded-2xl sm:px-4 sm:py-3" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="">All classes</option>
              {classes.map((cls) => <option value={cls.id} key={cls.id}>{cls.subjectName}</option>)}
            </select>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none sm:rounded-2xl sm:py-3 sm:pl-10 sm:pr-4" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--school-blue)] px-3 py-2.5 text-sm font-semibold text-white sm:rounded-2xl sm:px-4 sm:py-3" onClick={openCreateForm}>
              <Plus size={16} />
              Create Student
            </button>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="overflow-visible rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3 sm:px-4 sm:py-4">
            <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Students</h3>
            <span className="text-xs text-slate-500">{filteredStudents.length} shown</span>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredStudents.map((student) => (
              <article className="relative px-3 py-3" key={student.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{student.firstName} {student.lastName}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{student.studentNumber} / {student.user.username}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{student.email ?? 'No email set'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${student.user.isFirstLogin ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {student.user.isFirstLogin ? 'Temporary' : 'Active'}
                    </span>
                    <button className="rounded-lg border border-slate-200 p-1.5 text-slate-500" onClick={() => setOpenMenuStudentId((current) => current === student.id ? '' : student.id)} title="Student actions">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <p className="truncate"><span className="font-medium text-slate-800">{student.section.name}</span></p>
                  <p className="line-clamp-2">{student.classStudents.map((entry) => entry.class.subjectName).join(', ') || 'No classes assigned'}</p>
                </div>
                {openMenuStudentId === student.id ? (
                  <div className="absolute right-3 top-11 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 text-sm shadow-xl">
                    <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-medium text-slate-700 hover:bg-slate-50" onClick={() => handleEdit(student)}>
                      <Pencil size={16} className="text-slate-500" />
                      Edit student
                    </button>
                    <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-medium text-slate-700 hover:bg-slate-50" onClick={() => void copyStudentUsername(student)}>
                      <Copy size={16} className="text-slate-500" />
                      Copy username
                    </button>
                    <div className="my-1.5 border-t border-slate-100" />
                    <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-medium text-rose-700 hover:bg-rose-50" onClick={() => openDeleteDialog(student)}>
                      <Trash2 size={16} />
                      Delete student
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
            {!loading && filteredStudents.length === 0 ? (
              <div className="p-4">
                <StateMessage
                  title={students.length === 0 ? 'Create your first student account' : 'No matching students'}
                  description={students.length === 0 ? 'Student accounts start with a temporary password and can be assigned to section classes immediately.' : 'Try clearing the section, class, or search filters.'}
                />
              </div>
            ) : null}
            {loading ? <div className="p-6 text-center text-sm text-slate-500">Loading students...</div> : null}
          </div>

          <div className="hidden divide-y divide-slate-100 md:block">
              {filteredStudents.map((student) => (
                <article className="relative grid grid-cols-[minmax(160px,1.1fr)_minmax(140px,0.9fr)_minmax(220px,1.4fr)_104px_40px] items-center gap-3 px-4 py-3 text-sm" key={student.id}>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-slate-500">{student.studentNumber}</p>
                    <p className="text-xs text-slate-400">{student.email ?? 'No email set'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-slate-700">{student.user.username}</p>
                    <p className="text-xs text-slate-500">{student.section.name}</p>
                  </div>
                  <p className="line-clamp-2 text-slate-600">{student.classStudents.map((entry) => entry.class.subjectName).join(', ') || 'None'}</p>
                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${student.user.isFirstLogin ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {student.user.isFirstLogin ? 'Temporary' : 'Active'}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <button className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" onClick={() => setOpenMenuStudentId((current) => current === student.id ? '' : student.id)} title="Student actions">
                      <MoreVertical size={16} />
                    </button>
                    {openMenuStudentId === student.id ? (
                      <div className="absolute right-4 top-11 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 text-sm shadow-xl">
                        <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-medium text-slate-700 hover:bg-slate-50" onClick={() => handleEdit(student)}>
                          <Pencil size={16} className="text-slate-500" />
                          Edit student
                        </button>
                        <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-medium text-slate-700 hover:bg-slate-50" onClick={() => void copyStudentUsername(student)}>
                          <Copy size={16} className="text-slate-500" />
                          Copy username
                        </button>
                        <div className="my-1.5 border-t border-slate-100" />
                        <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-medium text-rose-700 hover:bg-rose-50" onClick={() => openDeleteDialog(student)}>
                          <Trash2 size={16} />
                          Delete student
                        </button>
                      </div>
                    ) : null}
                    </div>
                </article>
              ))}
              {!loading && filteredStudents.length === 0 ? (
                <div className="p-4">
                    <StateMessage
                      title={students.length === 0 ? 'Create your first student account' : 'No matching students'}
                      description={students.length === 0 ? 'Student accounts start with a temporary password and can be assigned to section classes immediately.' : 'Try clearing the section, class, or search filters.'}
                    />
                </div>
              ) : null}
              {loading ? <div className="p-8 text-center text-sm text-slate-500">Loading students...</div> : null}
          </div>
        </div>
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-3 backdrop-blur-sm sm:p-6">
          <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 sm:max-h-[92vh] sm:rounded-3xl">
            <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
              {temporaryPassword ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 size={18} />
                    Student account created
                  </div>
                  <p className="mt-3 text-sm">Temporary password:</p>
                  <p className="mt-2 rounded-2xl bg-white px-4 py-3 font-mono text-lg text-slate-900">{temporaryPassword}</p>
                </div>
              ) : null}

              <form onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold sm:text-lg">{editingStudentId ? 'Edit Student' : 'Create Student'}</h3>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{editingStudentId ? 'Update roster details and class assignment.' : 'A temporary password is generated after creation.'}</p>
            </div>
            <button type="button" className="rounded-xl border border-slate-200 p-2 text-slate-500" onClick={resetForm} title="Close form">
                <X size={16} />
            </button>
          </div>

          <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none disabled:text-slate-400 sm:rounded-2xl sm:px-4 sm:py-3" value={form.username} disabled={Boolean(editingStudentId)} onChange={(event) => updateField('username', event.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Student Number</span>
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none sm:rounded-2xl sm:px-4 sm:py-3" value={form.studentNumber} onChange={(event) => updateField('studentNumber', event.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none sm:rounded-2xl sm:px-4 sm:py-3" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">First Name</span>
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none sm:rounded-2xl sm:px-4 sm:py-3" value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Last Name</span>
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none sm:rounded-2xl sm:px-4 sm:py-3" value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} required />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Section</span>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none sm:rounded-2xl sm:px-4 sm:py-3" value={form.sectionId} onChange={(event) => updateField('sectionId', event.target.value)} required>
                {sections.map((section) => <option value={section.id} key={section.id}>{section.name}</option>)}
              </select>
            </label>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Classes</p>
              <div className="space-y-2">
                {availableClasses.map((cls) => (
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3" key={cls.id}>
                    <span>{cls.subjectName}</span>
                    <input type="checkbox" checked={form.classIds.includes(cls.id)} onChange={() => toggleClass(cls.id)} />
                  </label>
                ))}
                {availableClasses.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-center text-sm text-slate-500">No classes in this section.</p> : null}
              </div>
            </div>
          </div>

          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--school-blue)] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:mt-6 sm:rounded-2xl sm:px-4 sm:py-3" disabled={saving || !form.sectionId} type="submit">
            <Plus size={18} />
            {saving ? 'Saving...' : editingStudentId ? 'Save Changes' : 'Create Student'}
          </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete student?"
        description={deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}'s account, class enrollments, and recitation records will be removed.` : ''}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
