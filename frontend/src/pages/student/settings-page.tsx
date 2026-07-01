import { useNavigate } from 'react-router-dom'
import { PasswordSettingsCard } from '../../components/settings/password-settings-card'
import { useAuth } from '../../lib/use-auth'

export function StudentSettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="grid gap-8 xl:grid-cols-[520px_1fr]">
      <PasswordSettingsCard
        description={user?.isFirstLogin ? 'Change your temporary password to continue.' : 'Update your account password.'}
        firstLogin={user?.isFirstLogin}
        onSuccess={() => {
          if (user?.isFirstLogin) {
            navigate('/student/dashboard')
          }
        }}
      />
    </div>
  )
}
