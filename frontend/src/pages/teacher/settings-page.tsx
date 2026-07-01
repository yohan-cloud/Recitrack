import { BellRing, Brush, ChevronRight, Info, KeyRound, Save, SlidersHorizontal, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PasswordSettingsCard } from '../../components/settings/password-settings-card'
import { useAuth } from '../../lib/use-auth'
import { getTeacherSettings, updateTeacherSettings } from '../../services/teacher'
import type { TeacherPreferences, TeacherSettings } from '../../types/teacher'

type TeacherProfile = {
  firstName?: string
  lastName?: string
  email?: string
}

const sections = [
  { id: 'account', label: 'Account', icon: UserRound },
  { id: 'security', label: 'Security', icon: KeyRound },
  { id: 'preferences', label: 'Class Preferences', icon: SlidersHorizontal },
  { id: 'appearance', label: 'Appearance', icon: Brush },
  { id: 'about', label: 'About', icon: Info }
]

const defaultPreferences: TeacherPreferences = {
  sorting: 'alphabetical',
  dashboardView: 'today',
  excludeAbsent: true,
  avoidConsecutive: true,
  excludeRecent: false,
  resetDaily: true,
  notificationDuration: 6,
  theme: 'light',
  animations: true
}

export function TeacherSettingsPage() {
  const { accessToken, user } = useAuth()
  const profile = (user?.profile ?? {}) as TeacherProfile
  const [activeSection, setActiveSection] = useState(sections[0].id)
  const [profileFormOpen, setProfileFormOpen] = useState(false)
  const [editableProfile, setEditableProfile] = useState({
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    email: profile.email ?? '',
    school: ''
  })
  const [preferences, setPreferences] = useState<TeacherPreferences>(defaultPreferences)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState('')
  const [settingsError, setSettingsError] = useState('')

  useEffect(() => {
    if (!accessToken) {
      return
    }

    const loadSettings = async () => {
      try {
        setSettingsLoading(true)
        setSettingsError('')
        const settings = await getTeacherSettings(accessToken)
        setEditableProfile({
          firstName: settings.firstName,
          lastName: settings.lastName,
          email: settings.email,
          school: settings.school
        })
        setPreferences(settings.preferences)
      } catch {
        setSettingsError('Unable to load teacher settings.')
        setEditableProfile({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          email: profile.email ?? '',
          school: ''
        })
      } finally {
        setSettingsLoading(false)
      }
    }

    void loadSettings()
  }, [accessToken, profile.firstName, profile.lastName])

  useEffect(() => {
    const isDark = preferences.theme === 'dark'
    document.documentElement.classList.toggle('theme-dark', isDark)
  }, [preferences.theme])

  const fullName = `${editableProfile.firstName} ${editableProfile.lastName}`.trim() || 'Teacher'
  const accountRows = useMemo(() => [
    { label: 'Full Name', value: fullName },
    { label: 'Username', value: user?.username ?? 'Unknown' },
    { label: 'Email', value: editableProfile.email || 'Not set' },
    { label: 'Role', value: user?.role ?? 'Unknown' },
    { label: 'School', value: editableProfile.school || 'Not set' }
  ], [editableProfile.email, editableProfile.school, fullName, user?.role, user?.username])

  const persistSettings = async (nextSettings?: TeacherSettings) => {
    if (!accessToken) {
      return
    }

    try {
      setSettingsSaving(true)
      setSettingsError('')
      setSettingsMessage('')
      const saved = await updateTeacherSettings(accessToken, nextSettings ?? {
        ...editableProfile,
        preferences
      })
      setEditableProfile({
        firstName: saved.firstName,
        lastName: saved.lastName,
        email: saved.email,
        school: saved.school
      })
      setPreferences(saved.preferences)
      setSettingsMessage('Settings saved.')
    } catch {
      setSettingsError('Unable to save teacher settings.')
    } finally {
      setSettingsSaving(false)
    }
  }

  const saveProfile = async () => {
    await persistSettings({
      ...editableProfile,
      preferences
    })
    setProfileFormOpen(false)
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
      <aside className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200 xl:sticky xl:top-6 xl:self-start">
        <div className="px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--school-blue)]">Settings</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Teacher Controls</h2>
        </div>
        <nav className="mt-2 grid gap-1">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                className={`flex items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive ? 'bg-[var(--school-blue)] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => {
                  setActiveSection(section.id)
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                type="button"
              >
                <span className="flex items-center gap-3">
                  <Icon size={17} />
                  {section.label}
                </span>
                <ChevronRight size={16} />
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="space-y-5">
        {settingsError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{settingsError}</div> : null}
        {settingsMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{settingsMessage}</div> : null}

        <section id="account" className="scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-blue-50 p-3 text-[var(--school-blue)]">
                <UserRound size={22} />
              </div>
              <h3 className="text-2xl font-semibold text-slate-950">Account</h3>
              <p className="mt-2 max-w-xl text-sm text-slate-500">Manage the teacher identity used across class records, reports, and dashboards.</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-[var(--school-blue)] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={() => setProfileFormOpen(true)} disabled={settingsLoading}>
              <UserRound size={16} />
              Edit Profile
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {accountRows.map((row) => (
              <div className="rounded-2xl bg-slate-50 px-4 py-3" key={row.label}>
                <p className="text-xs font-medium text-slate-500">{row.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{row.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="scroll-mt-6">
          <PasswordSettingsCard description="Update your password regularly to keep class records protected." />
        </section>

        <section id="preferences" className="scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-[var(--school-blue)]">
              <SlidersHorizontal size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-950">Class Preferences</h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">Defaults for daily recitation tracking and classroom workflow.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Default student sorting</span>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white" value={preferences.sorting} onChange={(event) => setPreferences((current) => ({ ...current, sorting: event.target.value as TeacherPreferences['sorting'] }))}>
                <option value="alphabetical">Alphabetical</option>
                <option value="studentNumber">Student Number</option>
                <option value="mostRecitations">Most Recitations</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Default dashboard view</span>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white" value={preferences.dashboardView} onChange={(event) => setPreferences((current) => ({ ...current, dashboardView: event.target.value as TeacherPreferences['dashboardView'] }))}>
                <option value="today">Today&apos;s Recitations</option>
                <option value="total">Total Recitations</option>
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <BellRing className="text-[var(--school-blue)]" size={20} />
              <div>
                <h4 className="font-semibold text-slate-950">Random Student Picker</h4>
                <p className="text-sm text-slate-500">Control how students are selected during recitation.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <ToggleRow label="Exclude absent students" checked={preferences.excludeAbsent} onChange={(value) => setPreferences((current) => ({ ...current, excludeAbsent: value }))} />
              <ToggleRow label="Avoid selecting the same student twice consecutively" checked={preferences.avoidConsecutive} onChange={(value) => setPreferences((current) => ({ ...current, avoidConsecutive: value }))} />
              <ToggleRow label="Exclude recently selected students" checked={preferences.excludeRecent} onChange={(value) => setPreferences((current) => ({ ...current, excludeRecent: value }))} />
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_240px]">
            <ToggleRow label="Automatically reset today's recitation counts each day" checked={preferences.resetDaily} onChange={(value) => setPreferences((current) => ({ ...current, resetDaily: value }))} />
            <label className="block rounded-2xl border border-slate-200 p-4">
              <span className="mb-3 block text-sm font-medium text-slate-700">Notification duration: {preferences.notificationDuration}s</span>
              <input className="w-full accent-[var(--school-blue)]" type="range" min={5} max={10} value={preferences.notificationDuration} onChange={(event) => setPreferences((current) => ({ ...current, notificationDuration: Number(event.target.value) }))} />
            </label>
          </div>

          <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={() => void persistSettings()} disabled={settingsSaving || settingsLoading}>
            <Save size={16} />
            {settingsSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </section>

        <section id="appearance" className="scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-[var(--school-blue)]">
              <Brush size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-950">Appearance</h3>
              <p className="mt-2 text-sm text-slate-500">Keep the interface calm and readable during class.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Theme</span>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white" value={preferences.theme} onChange={(event) => setPreferences((current) => ({ ...current, theme: event.target.value as TeacherPreferences['theme'] }))}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <ToggleRow label="Enable animations" checked={preferences.animations} onChange={(value) => setPreferences((current) => ({ ...current, animations: value }))} />
          </div>
        </section>

        <section id="about" className="scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-[var(--school-blue)]">
              <Info size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-950">About</h3>
              <p className="mt-2 text-sm text-slate-500">System information for ReciTrack.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <InfoTile label="Version" value="ReciTrack v1.0" />
            <InfoTile label="Developer" value="Yohan / ReciTrack Team" />
            <InfoTile label="Copyright" value="2026 ReciTrack" />
          </div>
        </section>
      </div>

      {profileFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
          <form className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:p-6" onSubmit={(event) => {
            event.preventDefault()
            void saveProfile()
          }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Edit Profile</h3>
                <p className="mt-1 text-sm text-slate-500">Update the teacher details shown in Settings.</p>
              </div>
              <button className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-slate-900" type="button" onClick={() => setProfileFormOpen(false)} title="Close profile editor">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">First Name</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white" value={editableProfile.firstName} onChange={(event) => setEditableProfile((current) => ({ ...current, firstName: event.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Last Name</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white" value={editableProfile.lastName} onChange={(event) => setEditableProfile((current) => ({ ...current, lastName: event.target.value }))} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white" type="email" value={editableProfile.email} onChange={(event) => setEditableProfile((current) => ({ ...current, email: event.target.value }))} placeholder="teacher@email.com" required />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">School</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white" value={editableProfile.school} onChange={(event) => setEditableProfile((current) => ({ ...current, school: event.target.value }))} placeholder="School name" />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" type="button" onClick={() => setProfileFormOpen(false)}>
                Cancel
              </button>
              <button className="rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={settingsSaving}>
                {settingsSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

type ToggleRowProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input className="h-5 w-5 accent-[var(--school-blue)]" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  )
}
