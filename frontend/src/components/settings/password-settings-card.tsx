import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { AxiosError } from 'axios'
import { useAuth } from '../../lib/use-auth'

type PasswordSettingsCardProps = {
  description: string
  firstLogin?: boolean
  onSuccess?: () => void
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    return message ?? 'Unable to change password.'
  }

  return 'Unable to change password.'
}

function getPasswordStrength(password: string) {
  const checks = [
    password.length >= 10,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ]
  const score = checks.filter(Boolean).length

  if (!password) {
    return { label: 'Waiting for new password', width: '0%', color: 'bg-slate-200', textColor: 'text-slate-500' }
  }

  if (score <= 2) {
    return { label: 'Weak', width: '33%', color: 'bg-rose-500', textColor: 'text-rose-600' }
  }

  if (score <= 4) {
    return { label: 'Good', width: '66%', color: 'bg-blue-500', textColor: 'text-[var(--school-blue)]' }
  }

  return { label: 'Strong', width: '100%', color: 'bg-emerald-500', textColor: 'text-emerald-600' }
}

export function PasswordSettingsCard({ description, firstLogin = false, onSuccess }: PasswordSettingsCardProps) {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const passwordType = showPasswords ? 'text' : 'password'
  const strength = getPasswordStrength(newPassword)
  const canSubmit = currentPassword.length >= 6 && newPassword.length >= 10 && confirmPassword.length >= 10 && !saving

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.')
      return
    }

    try {
      setSaving(true)
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Password updated.')
      onSuccess?.()
    } catch (changeError) {
      setError(getErrorMessage(changeError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-6 inline-flex rounded-2xl bg-blue-50 p-3 text-[var(--school-blue)]">
            <KeyRound size={22} />
          </div>
          <h2 className="text-2xl font-semibold">Change Password</h2>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <button
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:text-slate-900"
          type="button"
          onClick={() => setShowPasswords((value) => !value)}
          aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
        >
          {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {firstLogin ? <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Temporary password is active.</p> : null}
      {message ? <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Current Password</span>
          <input type={passwordType} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">New Password</span>
          <input type={passwordType} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={10} required />
          <span className="mt-2 block text-xs text-slate-500">Use at least 10 characters with uppercase, lowercase, a number, and a symbol.</span>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
            </div>
            <p className={`mt-1 text-xs font-medium ${strength.textColor}`}>Password strength: {strength.label}</p>
          </div>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Confirm New Password</span>
          <input type={passwordType} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={10} required />
        </label>
      </div>

      <button className="mt-6 w-full rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={!canSubmit} type="submit">
        {saving ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  )
}
