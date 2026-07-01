import { useEffect, useState } from 'react'
import { BookOpen, CalendarDays, CheckCircle2, IdCard, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../../lib/use-auth'
import { getMyClasses } from '../../services/student'
import type { StudentClass } from '../../types/student'

type StudentProfile = {
  studentNumber?: string
  firstName?: string
  lastName?: string
  sectionId?: string
}

export function StudentProfilePage() {
  const { accessToken, user } = useAuth()
  const profile = (user?.profile ?? {}) as StudentProfile
  const [classes, setClasses] = useState<StudentClass[]>([])

  useEffect(() => {
    if (!accessToken) {
      return
    }

    void getMyClasses(accessToken).then(setClasses).catch(() => setClasses([]))
  }, [accessToken])

  const section = classes[0]?.section
  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Student'

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
          <div className="bg-[var(--school-blue)] p-5 text-white sm:p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/20">
              <UserRound size={30} />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">{fullName}</h2>
            <p className="mt-1 text-sm text-blue-100">{user?.username}</p>
            <p className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm text-blue-50">
              {section ? `${section.gradeLevel} / ${section.name}` : 'No section assigned'}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-sm font-semibold text-[var(--school-blue)]">Student account</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-950">Profile Overview</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Your profile is managed by your teacher. Use this page to verify your account and enrolled subjects.</p>

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ProfileStat label="Student No." value={profile.studentNumber ?? 'Not set'} icon={<IdCard size={18} />} />
              <ProfileStat label="Subjects" value={String(classes.length)} icon={<BookOpen size={18} />} />
              <ProfileStat label="Section" value={section?.name ?? 'None'} icon={<ShieldCheck size={18} />} />
              <ProfileStat label="Status" value={user?.isFirstLogin ? 'Temporary' : 'Active'} icon={<CheckCircle2 size={18} />} />
            </div>
          </div>
        </div>
      </section>

      {user?.isFirstLogin ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Your account is still using a temporary password. Go to Settings to update it.
        </section>
      ) : null}

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--school-blue)]">Academic details</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">Enrolled Subjects</h3>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[var(--school-blue)]">{classes.length} total</span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => (
            <article className="rounded-3xl border border-slate-200 p-4" key={cls.id}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[var(--school-blue)]">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="line-clamp-2 text-sm font-semibold text-slate-950">{cls.subjectName}</h4>
                  <p className="mt-1 text-xs text-slate-500">{cls.section.gradeLevel} / {cls.section.name}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                <CalendarDays size={16} />
                <span className="truncate">{cls.scheduleDay}, {cls.scheduleTime}</span>
              </div>
            </article>
          ))}
          {!classes.length ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">No subjects assigned yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function ProfileStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center sm:p-4">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[var(--school-blue)]">
        {icon}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-slate-950">{value}</p>
      <p className="mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
    </div>
  )
}
