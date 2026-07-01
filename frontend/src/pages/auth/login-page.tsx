import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../lib/use-auth'
import { forgotPasswordRequest, resetPasswordRequest } from '../../services/auth'

const schema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(6, 'Password is required')
})

type FormValues = z.infer<typeof schema>
type ResetStep = 'login' | 'request' | 'reset'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [resetStep, setResetStep] = useState<ResetStep>('login')
  const [resetUsername, setResetUsername] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    if (user) {
      navigate(user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard')
    }
  }, [navigate, user])

  const onSubmit = async (values: FormValues) => {
    try {
      const signedInUser = await login(values)
      navigate(signedInUser.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard')
    } catch {
      setError('root', { message: 'Invalid username or password' })
    }
  }

  const requestReset = async () => {
    try {
      setResetLoading(true)
      setResetError('')
      setResetMessage('')
      await forgotPasswordRequest({ username: resetUsername })
      setResetMessage('If this username has an email, a reset code was sent.')
      setResetStep('reset')
    } catch {
      setResetError('Unable to request a reset code.')
    } finally {
      setResetLoading(false)
    }
  }

  const submitReset = async () => {
    try {
      setResetLoading(true)
      setResetError('')
      await resetPasswordRequest({ username: resetUsername, code: resetCode, newPassword })
      setResetMessage('Password reset. You can now sign in.')
      setResetStep('login')
      setResetCode('')
      setNewPassword('')
    } catch {
      setResetError('Invalid code or password requirements not met.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-xl ring-1 ring-slate-200 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-[var(--school-blue)] px-10 py-12 text-white">
          <div className="max-w-md">
            <p className="text-sm uppercase tracking-[0.25em] text-blue-100">ReciTrack v1.0</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">Role-based recitation tracking for modern classrooms.</h1>
            <p className="mt-4 text-base text-blue-100">Teachers manage sections, classes, and recitation data. Students view their own records only.</p>
          </div>
        </div>
        <div className="px-8 py-10 md:px-12">
          <div className="mx-auto max-w-md">
            <h2 className="text-3xl font-semibold text-slate-900">{resetStep === 'login' ? 'Sign in' : resetStep === 'request' ? 'Forgot password' : 'Enter reset code'}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {resetStep === 'login' ? 'Use your username and password issued by your teacher or administrator.' : 'Use your username. If an email is saved on the account, a reset code will be sent.'}
            </p>

            {resetMessage ? <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{resetMessage}</p> : null}
            {resetError ? <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{resetError}</p> : null}

            {resetStep === 'login' ? (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                <input {...register('username')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0" />
                {errors.username ? <p className="mt-2 text-sm text-rose-600">{errors.username.message}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input type="password" {...register('password')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0" />
                {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p> : null}
              </div>
              {errors.root ? <p className="text-sm text-rose-600">{errors.root.message}</p> : null}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {isSubmitting ? 'Signing in...' : 'Login'}
              </button>
              <button type="button" className="w-full text-center text-sm font-semibold text-[var(--school-blue)]" onClick={() => {
                setResetStep('request')
                setResetError('')
                setResetMessage('')
              }}>
                Forgot password?
              </button>
            </form>
            ) : null}

            {resetStep === 'request' ? (
              <form className="mt-8 space-y-5" onSubmit={(event) => {
                event.preventDefault()
                void requestReset()
              }}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                  <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0" value={resetUsername} onChange={(event) => setResetUsername(event.target.value)} required />
                </div>
                <button type="submit" disabled={resetLoading || resetUsername.length < 3} className="w-full rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  {resetLoading ? 'Sending code...' : 'Send Reset Code'}
                </button>
                <button type="button" className="w-full text-center text-sm font-semibold text-slate-500" onClick={() => setResetStep('login')}>Back to login</button>
              </form>
            ) : null}

            {resetStep === 'reset' ? (
              <form className="mt-8 space-y-5" onSubmit={(event) => {
                event.preventDefault()
                void submitReset()
              }}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Code</label>
                  <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0" value={resetCode} onChange={(event) => setResetCode(event.target.value)} inputMode="numeric" maxLength={6} required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
                  <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                  <p className="mt-2 text-xs text-slate-500">At least 10 characters with uppercase, lowercase, number, and symbol.</p>
                </div>
                <button type="submit" disabled={resetLoading || resetCode.length !== 6 || newPassword.length < 10} className="w-full rounded-2xl bg-[var(--school-blue)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button type="button" className="w-full text-center text-sm font-semibold text-slate-500" onClick={() => setResetStep('request')}>Send another code</button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
