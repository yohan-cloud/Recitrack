import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { BookOpen, ExternalLink, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../../components/common/confirm-dialog'
import { StateMessage } from '../../components/common/state-message'
import { useAuth } from '../../lib/use-auth'
import { createClass, deleteClass, getClasses, getSections, updateClass } from '../../services/teacher'
import type { ClassPayload, Section, TeacherClass } from '../../types/teacher'

const blankForm: ClassPayload = {
  sectionId: '',
  subjectName: '',
  scheduleDay: '',
  scheduleTime: ''
}

export function ClassesPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [sections, setSections] = useState<Section[]>([])
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [form, setForm] = useState<ClassPayload>(blankForm)
  const [editingClassId, setEditingClassId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TeacherClass | null>(null)
  const [error, setError] = useState('')

  const loadData = async () => {
    if (!accessToken) {
      return
    }

    try {
      setLoading(true)
      setError('')
      const [sectionList, classList] = await Promise.all([getSections(accessToken), getClasses(accessToken)])
      setSections(sectionList)
      setClasses(classList)
      setForm((current) => ({ ...current, sectionId: current.sectionId || sectionList[0]?.id || '' }))
    } catch {
      setError('Unable to load classes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [accessToken])

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase()
    return classes.filter((cls) => {
      const matchesSearch = !query || `${cls.subjectName} ${cls.section.name} ${cls.scheduleDay} ${cls.scheduleTime}`.toLowerCase().includes(query)
      const matchesSection = !sectionFilter || cls.sectionId === sectionFilter
      return matchesSearch && matchesSection
    })
  }, [classes, search, sectionFilter])

  const resetForm = () => {
    setEditingClassId('')
    setFormOpen(false)
    setForm({ ...blankForm, sectionId: sections[0]?.id || '' })
  }

  const openCreateForm = () => {
    setEditingClassId('')
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
      if (editingClassId) {
        await updateClass(accessToken, editingClassId, form)
      } else {
        await createClass(accessToken, form)
      }
      resetForm()
      await loadData()
    } catch {
      setError(editingClassId ? 'Unable to update class.' : 'Unable to create class.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (cls: TeacherClass) => {
    setEditingClassId(cls.id)
    setFormOpen(true)
    setForm({
      sectionId: cls.sectionId,
      subjectName: cls.subjectName,
      scheduleDay: cls.scheduleDay,
      scheduleTime: cls.scheduleTime
    })
  }

  const handleDelete = async () => {
    if (!accessToken || !deleteTarget) {
      return
    }

    try {
      setDeleting(true)
      setError('')
      await deleteClass(accessToken, deleteTarget.id)
      setClasses((current) => current.filter((item) => item.id !== deleteTarget.id))
      if (editingClassId === deleteTarget.id) {
        resetForm()
      }
      setDeleteTarget(null)
    } catch {
      setError('Unable to delete class.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs text-[var(--school-blue)] sm:text-sm">Subject setup</p>
            <h2 className="mt-0.5 text-2xl font-semibold text-slate-900 sm:text-3xl">Classes</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">Create subjects under each section and open recitation tracking.</p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-3 lg:gap-3">
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none sm:rounded-2xl sm:px-4 sm:py-3" value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
              <option value="">All sections</option>
              {sections.map((section) => <option value={section.id} key={section.id}>{section.name}</option>)}
            </select>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none sm:rounded-2xl sm:py-3 sm:pl-10 sm:pr-4" placeholder="Search classes" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--school-blue)] px-3 py-2.5 text-sm font-semibold text-white sm:rounded-2xl sm:px-4 sm:py-3" onClick={openCreateForm} disabled={sections.length === 0}>
              <Plus size={16} />
              Create Class
            </button>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClasses.map((cls) => (
            <article className="min-w-0 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4" key={cls.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-3 inline-flex rounded-2xl bg-blue-50 p-2 text-[var(--school-blue)]">
                    <BookOpen size={16} />
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 sm:text-base">{cls.subjectName}</h3>
                  <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">{cls.section.name}</p>
                </div>
                <div className="grid shrink-0 grid-cols-3 gap-1">
                  <button className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-50" onClick={() => navigate(`/teacher/classes/${cls.id}`)} title="Open class details">
                    <ExternalLink size={14} />
                  </button>
                  <button className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-50" onClick={() => handleEdit(cls)} title="Edit class">
                    <Pencil size={14} />
                  </button>
                  <button className="rounded-lg border border-rose-200 p-1 text-rose-600 hover:bg-rose-50" onClick={() => setDeleteTarget(cls)} title="Delete class">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-[1.4fr_0.6fr] gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 sm:text-sm">{cls.scheduleDay}</p>
                  <p className="mt-1 truncate text-[10px] text-slate-500 sm:text-xs">{cls.scheduleTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold leading-none text-slate-900 sm:text-2xl">{cls._count?.classStudents ?? 0}</p>
                  <p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-slate-500 sm:text-[10px]">Students</p>
                </div>
              </div>
            </article>
          ))}
          {!loading && filteredClasses.length === 0 ? (
            <div className="lg:col-span-2">
              <StateMessage
                title={classes.length === 0 ? 'Create your first class' : 'No matching classes'}
                description={classes.length === 0 ? 'Classes are subjects attached to a section. Create one to unlock class details, recitations, analytics, and reports.' : 'Try clearing the filters or search term to see more classes.'}
                action={sections.length === 0 ? (
                  <button className="rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white" onClick={() => navigate('/teacher/sections')}>
                    Create Section First
                  </button>
                ) : null}
              />
            </div>
          ) : null}
          {loading ? <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 lg:col-span-2">Loading classes...</div> : null}
        </div>
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-3 backdrop-blur-sm sm:p-6">
          <form className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:max-h-[92vh] sm:p-6" onSubmit={handleSubmit}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{editingClassId ? 'Edit Class' : 'Create Class'}</h3>
                <p className="mt-1 text-sm text-slate-500">Classes belong to one section.</p>
              </div>
              <button className="rounded-xl border border-slate-200 p-2 text-slate-500" type="button" onClick={resetForm} title="Close form">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Section</span>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.sectionId} onChange={(event) => setForm((current) => ({ ...current, sectionId: event.target.value }))} required>
                  {sections.map((section) => <option value={section.id} key={section.id}>{section.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Subject Name</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.subjectName} onChange={(event) => setForm((current) => ({ ...current, subjectName: event.target.value }))} required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Schedule Day</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.scheduleDay} onChange={(event) => setForm((current) => ({ ...current, scheduleDay: event.target.value }))} placeholder="Monday" required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Schedule Time</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.scheduleTime} onChange={(event) => setForm((current) => ({ ...current, scheduleTime: event.target.value }))} placeholder="08:00 AM - 09:30 AM" required />
              </label>
            </div>

            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving || !form.sectionId} type="submit">
              <Plus size={18} />
              {saving ? 'Saving...' : editingClassId ? 'Save Class' : 'Create Class'}
            </button>
          </form>
        </div>
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete class?"
        description={deleteTarget ? `${deleteTarget.subjectName} will be removed with its enrollments, recitations, announcements, and related records.` : ''}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
