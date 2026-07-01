import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Megaphone, Pencil, Plus, Trash2, X } from 'lucide-react'
import { ConfirmDialog } from '../../components/common/confirm-dialog'
import { StateMessage } from '../../components/common/state-message'
import { useAuth } from '../../lib/use-auth'
import { createAnnouncement, deleteAnnouncement, getAnnouncements, getClasses, updateAnnouncement } from '../../services/teacher'
import type { Announcement, AnnouncementPayload, TeacherClass } from '../../types/teacher'

const blankForm: AnnouncementPayload = {
  classId: '',
  title: '',
  message: '',
  type: 'NORMAL',
  expiresAt: ''
}

const announcementTypeLabels: Record<Announcement['type'], string> = {
  NORMAL: 'Normal',
  IMPORTANT: 'Important',
  REMINDER: 'Reminder',
  ASSIGNMENT: 'Assignment'
}

const announcementTypeStyles: Record<Announcement['type'], string> = {
  NORMAL: 'bg-slate-100 text-slate-600',
  IMPORTANT: 'bg-blue-50 text-[var(--school-blue)]',
  REMINDER: 'bg-cyan-50 text-cyan-700',
  ASSIGNMENT: 'bg-indigo-50 text-indigo-700'
}

function toDateInputValue(date: string | null) {
  return date ? date.slice(0, 10) : ''
}

function isExpired(date: string | null) {
  return Boolean(date && new Date(date).getTime() < Date.now())
}

export function AnnouncementsPage() {
  const { accessToken } = useAuth()
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [form, setForm] = useState<AnnouncementPayload>(blankForm)
  const [editingId, setEditingId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)
  const [error, setError] = useState('')

  const selectedClass = useMemo(() => classes.find((cls) => cls.id === selectedClassId), [classes, selectedClassId])

  const loadClasses = async () => {
    if (!accessToken) {
      return
    }

    try {
      setLoading(true)
      setError('')
      const classList = await getClasses(accessToken)
      setClasses(classList)
      const firstClassId = selectedClassId || classList[0]?.id || ''
      setSelectedClassId(firstClassId)
      setForm((current) => ({ ...current, classId: firstClassId }))
    } catch {
      setError('Unable to load classes.')
    } finally {
      setLoading(false)
    }
  }

  const loadAnnouncements = async (classId: string) => {
    if (!accessToken || !classId) {
      setAnnouncements([])
      return
    }

    try {
      setError('')
      setAnnouncements(await getAnnouncements(accessToken, classId))
    } catch {
      setError('Unable to load announcements.')
    }
  }

  useEffect(() => {
    void loadClasses()
  }, [accessToken])

  useEffect(() => {
    void loadAnnouncements(selectedClassId)
  }, [accessToken, selectedClassId])

  const resetForm = () => {
    setEditingId('')
    setForm({ ...blankForm, classId: selectedClassId })
    setFormOpen(false)
  }

  const openCreateForm = () => {
    setEditingId('')
    setForm({ ...blankForm, classId: selectedClassId })
    setFormOpen(true)
  }

  const openEditForm = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setForm({
      classId: announcement.classId,
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      expiresAt: toDateInputValue(announcement.expiresAt)
    })
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
      if (editingId) {
        await updateAnnouncement(accessToken, editingId, { title: form.title, message: form.message, type: form.type, expiresAt: form.expiresAt })
      } else {
        await createAnnouncement(accessToken, form)
      }
      resetForm()
      await loadAnnouncements(selectedClassId)
    } catch {
      setError(editingId ? 'Unable to update announcement.' : 'Unable to create announcement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!accessToken || !deleteTarget) {
      return
    }

    try {
      setDeleting(true)
      setError('')
      await deleteAnnouncement(accessToken, deleteTarget.id)
      setAnnouncements((current) => current.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      setError('Unable to delete announcement.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs text-[var(--school-blue)] sm:text-sm">Class updates</p>
            <h2 className="mt-0.5 text-2xl font-semibold text-slate-900 sm:text-3xl">Announcements</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">Post updates that only students in the selected class can see.</p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-[1fr_auto] lg:max-w-xl">
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none sm:rounded-2xl sm:px-4 sm:py-3" value={selectedClassId} onChange={(event) => {
              setSelectedClassId(event.target.value)
              setForm((current) => ({ ...current, classId: event.target.value }))
            }}>
              {classes.length === 0 ? <option value="">No classes</option> : null}
              {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.subjectName} / {cls.section.name}</option>)}
            </select>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--school-blue)] px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-4 sm:py-3" onClick={openCreateForm} disabled={!selectedClassId}>
              <Plus size={16} />
              New Announcement
            </button>
          </div>
        </div>

        {selectedClass ? (
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-[var(--school-blue)]">
            Showing announcements for {selectedClass.subjectName} / {selectedClass.section.name}.
          </div>
        ) : null}

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {announcements.map((announcement) => (
          <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5" key={announcement.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-3 inline-flex rounded-2xl bg-blue-50 p-2 text-[var(--school-blue)]">
                  <Megaphone size={16} />
                </div>
                <h3 className="text-base font-semibold text-slate-950">{announcement.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${announcementTypeStyles[announcement.type]}`}>
                    {announcementTypeLabels[announcement.type]}
                  </span>
                  {announcement.expiresAt ? (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isExpired(announcement.expiresAt) ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                      {isExpired(announcement.expiresAt) ? 'Expired' : `Expires ${new Date(announcement.expiresAt).toLocaleDateString()}`}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-slate-500">{new Date(announcement.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {announcement.readCount ?? 0} read · {announcement.unreadCount ?? 0} unread
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50" onClick={() => openEditForm(announcement)} title="Edit announcement">
                  <Pencil size={14} />
                </button>
                <button className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50" onClick={() => setDeleteTarget(announcement)} title="Delete announcement">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">{announcement.message}</p>
          </article>
        ))}
        {!loading && announcements.length === 0 ? (
          <StateMessage title="No announcements yet" description="Create an announcement for the selected class. Students enrolled in that class will see it in their portal." />
        ) : null}
        {loading ? <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">Loading announcements...</div> : null}
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-3 backdrop-blur-sm sm:p-6">
          <form className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:p-6" onSubmit={handleSubmit}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{editingId ? 'Edit Announcement' : 'New Announcement'}</h3>
                <p className="mt-1 text-sm text-slate-500">Visible only to students enrolled in the selected class.</p>
              </div>
              <button className="rounded-xl border border-slate-200 p-2 text-slate-500" type="button" onClick={resetForm} title="Close form">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Class</span>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.classId} onChange={(event) => setForm((current) => ({ ...current, classId: event.target.value }))} disabled={Boolean(editingId)} required>
                  {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.subjectName} / {cls.section.name}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Type</span>
                  <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as Announcement['type'] }))}>
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="REMINDER">Reminder</option>
                    <option value="ASSIGNMENT">Assignment</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Expires</span>
                  <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" type="date" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} required />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} maxLength={120} required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Message</span>
                <textarea className="min-h-32 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} maxLength={1000} required />
              </label>
            </div>

            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving || !form.classId || !form.expiresAt} type="submit">
              <Megaphone size={18} />
              {saving ? 'Saving...' : editingId ? 'Save Announcement' : 'Post Announcement'}
            </button>
          </form>
        </div>
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete announcement?"
        description={deleteTarget ? `"${deleteTarget.title}" will be removed from the teacher and student portals.` : ''}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
