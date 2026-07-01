import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { ConfirmDialog } from '../../components/common/confirm-dialog'
import { StateMessage } from '../../components/common/state-message'
import { useAuth } from '../../lib/use-auth'
import { createSection, deleteSection, getSections, getStudents, updateSection } from '../../services/teacher'
import type { Section, SectionPayload, TeacherStudent } from '../../types/teacher'

const blankForm: SectionPayload = {
  name: '',
  gradeLevel: ''
}

function getFirstNumber(value: string) {
  return Number(value.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER)
}

function getLastNumber(value: string) {
  const matches = value.match(/\d+/g)
  return Number(matches?.[matches.length - 1] ?? Number.MAX_SAFE_INTEGER)
}

function sectionSortKey(section: Section) {
  const gradeNumber = getFirstNumber(section.gradeLevel)
  const nameNumber = getLastNumber(section.name)
  return { gradeNumber, nameNumber, name: section.name.toLowerCase() }
}

function sortSections(sectionList: Section[]) {
  return [...sectionList].sort((first, second) => {
    const firstKey = sectionSortKey(first)
    const secondKey = sectionSortKey(second)

    return firstKey.gradeNumber - secondKey.gradeNumber
      || firstKey.nameNumber - secondKey.nameNumber
      || firstKey.name.localeCompare(secondKey.name, undefined, { numeric: true, sensitivity: 'base' })
  })
}

type SectionSortMode = 'natural' | 'nameAsc' | 'nameDesc' | 'studentsDesc' | 'classesDesc'

function sortSectionsByMode(sectionList: Section[], mode: SectionSortMode) {
  if (mode === 'nameAsc') {
    return [...sectionList].sort((first, second) => first.name.localeCompare(second.name, undefined, { numeric: true, sensitivity: 'base' }))
  }

  if (mode === 'nameDesc') {
    return [...sectionList].sort((first, second) => second.name.localeCompare(first.name, undefined, { numeric: true, sensitivity: 'base' }))
  }

  if (mode === 'studentsDesc') {
    return [...sectionList].sort((first, second) => (second._count?.students ?? 0) - (first._count?.students ?? 0))
  }

  if (mode === 'classesDesc') {
    return [...sectionList].sort((first, second) => (second._count?.classes ?? 0) - (first._count?.classes ?? 0))
  }

  return sortSections(sectionList)
}

export function SectionsPage() {
  const { accessToken } = useAuth()
  const [sections, setSections] = useState<Section[]>([])
  const [form, setForm] = useState<SectionPayload>(blankForm)
  const [editingSectionId, setEditingSectionId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SectionSortMode>('natural')
  const [rosterOpen, setRosterOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [sectionStudents, setSectionStudents] = useState<TeacherStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null)
  const [error, setError] = useState('')

  const loadSections = async () => {
    if (!accessToken) {
      return
    }

    try {
      setLoading(true)
      setError('')
      setSections(await getSections(accessToken))
    } catch {
      setError('Unable to load sections.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSections()
  }, [accessToken])

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matches = query
      ? sections.filter((section) => `${section.name} ${section.gradeLevel}`.toLowerCase().includes(query))
      : sections

    return sortSectionsByMode(matches, sortMode)
  }, [search, sections, sortMode])

  const resetForm = () => {
    setEditingSectionId('')
    setFormOpen(false)
    setForm(blankForm)
  }

  const openCreateForm = () => {
    setEditingSectionId('')
    setForm(blankForm)
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
      if (editingSectionId) {
        await updateSection(accessToken, editingSectionId, form)
      } else {
        await createSection(accessToken, form)
      }
      resetForm()
      await loadSections()
    } catch {
      setError(editingSectionId ? 'Unable to update section.' : 'Unable to create section.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (section: Section) => {
    setEditingSectionId(section.id)
    setFormOpen(true)
    setForm({ name: section.name, gradeLevel: section.gradeLevel })
  }

  const handleDelete = async () => {
    if (!accessToken || !deleteTarget) {
      return
    }

    try {
      setDeleting(true)
      setError('')
      await deleteSection(accessToken, deleteTarget.id)
      setSections((current) => current.filter((item) => item.id !== deleteTarget.id))
      if (editingSectionId === deleteTarget.id) {
        resetForm()
      }
      setDeleteTarget(null)
    } catch {
      setError('Unable to delete section. Remove linked classes/students first.')
    } finally {
      setDeleting(false)
    }
  }

  const openRoster = async (section: Section) => {
    if (!accessToken) {
      return
    }

    try {
      setSelectedSection(section)
      setRosterOpen(true)
      setRosterLoading(true)
      setError('')
      setSectionStudents(await getStudents(accessToken, { sectionId: section.id }))
    } catch {
      setSectionStudents([])
      setError('Unable to load section roster.')
    } finally {
      setRosterLoading(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs text-[var(--school-blue)] sm:text-sm">Academic structure</p>
            <h2 className="mt-0.5 text-2xl font-semibold text-slate-900 sm:text-3xl">Sections</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">Create and organize the sections you teach.</p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-[1fr_auto] lg:max-w-2xl lg:grid-cols-[1fr_190px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none sm:rounded-2xl sm:py-3 sm:pl-10 sm:pr-4" placeholder="Search sections" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none sm:rounded-2xl sm:px-4 sm:py-3" value={sortMode} onChange={(event) => setSortMode(event.target.value as SectionSortMode)} title="Sort sections">
              <option value="natural">Section order</option>
              <option value="nameAsc">Name A-Z</option>
              <option value="nameDesc">Name Z-A</option>
              <option value="studentsDesc">Most students</option>
              <option value="classesDesc">Most classes</option>
            </select>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--school-blue)] px-3 py-2.5 text-sm font-semibold text-white sm:rounded-2xl sm:px-4 sm:py-3" onClick={openCreateForm}>
              <Plus size={16} />
              Create Section
            </button>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSections.map((section) => (
            <article className="min-w-0 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4" key={section.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-3 h-1.5 w-10 rounded-full bg-[var(--school-blue)]" />
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 sm:text-base">{section.name}</h3>
                  <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">{section.gradeLevel}</p>
                </div>
                <div className="flex gap-1">
                  <button className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-50" onClick={() => handleEdit(section)} title="Edit section">
                    <Pencil size={14} />
                  </button>
                  <button className="rounded-lg border border-rose-200 p-1 text-rose-600 hover:bg-rose-50" onClick={() => setDeleteTarget(section)} title="Delete section">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xl font-semibold leading-none text-slate-900 sm:text-2xl">{section._count?.students ?? 0}</p>
                  <p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-slate-500 sm:text-[10px]">Students</p>
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none text-slate-900 sm:text-2xl">{section._count?.classes ?? 0}</p>
                  <p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-slate-500 sm:text-[10px]">Classes</p>
                </div>
              </div>
              <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-[var(--school-blue)]" onClick={() => void openRoster(section)} type="button">
                <Users size={14} />
                View Students
              </button>
            </article>
          ))}
          {!loading && filteredSections.length === 0 ? (
            <div className="md:col-span-2">
              <StateMessage
                title={sections.length === 0 ? 'Create your first section' : 'No matching sections'}
                description={sections.length === 0 ? 'Sections group students and classes. Use the form to add the first section you teach.' : 'Try clearing the search or checking the section name and grade level.'}
              />
            </div>
          ) : null}
          {loading ? <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 md:col-span-2">Loading sections...</div> : null}
        </div>
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-3 backdrop-blur-sm sm:p-6">
          <form className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:p-6" onSubmit={handleSubmit}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{editingSectionId ? 'Edit Section' : 'Create Section'}</h3>
                <p className="mt-1 text-sm text-slate-500">Sections group students and classes.</p>
              </div>
              <button className="rounded-xl border border-slate-200 p-2 text-slate-500" type="button" onClick={resetForm} title="Close form">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Section Name</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Grade Level</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.gradeLevel} onChange={(event) => setForm((current) => ({ ...current, gradeLevel: event.target.value }))} required />
              </label>
            </div>

            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
              <Plus size={18} />
              {saving ? 'Saving...' : editingSectionId ? 'Save Section' : 'Create Section'}
            </button>
          </form>
        </div>
      ) : null}

      {rosterOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-3 backdrop-blur-sm sm:p-6">
          <section className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:max-h-[92vh] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--school-blue)]">{selectedSection?.gradeLevel}</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">{selectedSection?.name} Students</h3>
                <p className="mt-1 text-sm text-slate-500">{sectionStudents.length} student{sectionStudents.length === 1 ? '' : 's'} in this section.</p>
              </div>
              <button className="rounded-xl border border-slate-200 p-2 text-slate-500" type="button" onClick={() => setRosterOpen(false)} title="Close roster">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {sectionStudents.map((student) => (
                <article className="rounded-2xl border border-slate-200 p-4" key={student.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{student.firstName} {student.lastName}</p>
                      <p className="mt-1 text-xs text-slate-500">{student.studentNumber} / {student.user.username}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[var(--school-blue)]">{student.classStudents.length} class{student.classStudents.length === 1 ? '' : 'es'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {student.classStudents.map((entry) => (
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600" key={entry.id}>{entry.class.subjectName}</span>
                    ))}
                    {student.classStudents.length === 0 ? <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500">No classes assigned</span> : null}
                  </div>
                </article>
              ))}
              {!rosterLoading && sectionStudents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">No students in this section yet.</p>
              ) : null}
              {rosterLoading ? <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Loading students...</p> : null}
            </div>
          </section>
        </div>
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete section?"
        description={deleteTarget ? `${deleteTarget.name} will be deleted only if there are no linked students or classes blocking it.` : ''}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
