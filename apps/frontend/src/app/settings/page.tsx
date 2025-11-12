'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [profile, setProfile] = useState({ email: '', name: '' })
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)
  
  const [couple, setCouple] = useState<any>(null)
  const [coupleLoading, setCoupleLoading] = useState(true)
  
  const [smtp, setSmtp] = useState({
    host: '',
    port: 587,
    secure: true,
    username: '',
    password: '',
    fromName: '',
    fromEmail: '',
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
    loadCouple()
    loadSmtp()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await api.user.getProfile()
      setProfile({ email: data.user.email, name: data.user.name })
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const loadCouple = async () => {
    try {
      const data = await api.couple.get()
      setCouple(data.couple)
    } catch (error) {
      console.error('Failed to load couple info:', error)
    } finally {
      setCoupleLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    setProfileMessage(null)
    if (!profile.email || !profile.name) {
      setProfileMessage('Email and name are required')
      setTimeout(() => setProfileMessage(null), 3000)
      return
    }
    try {
      const updateData: { email?: string; name?: string } = {}
      if (profile.email.trim()) updateData.email = profile.email.trim()
      if (profile.name.trim()) updateData.name = profile.name.trim()
      
      if (Object.keys(updateData).length === 0) {
        setProfileMessage('No changes to save')
        setTimeout(() => setProfileMessage(null), 3000)
        return
      }
      
      const result = await api.user.updateProfile(updateData)
      // Update local state with the response
      if (result.user) {
        setProfile({ email: result.user.email, name: result.user.name })
      }
      setProfileMessage('Profile updated successfully!')
      setTimeout(() => setProfileMessage(null), 3000)
    } catch (error: any) {
      let errorMsg = 'Failed to update profile'
      if (error.message) {
        errorMsg = error.message
      } else if (error.error) {
        if (typeof error.error === 'string') {
          errorMsg = error.error
        } else if (error.error.email_taken) {
          errorMsg = 'Email is already taken'
        } else {
          errorMsg = JSON.stringify(error.error)
        }
      }
      setProfileMessage(errorMsg)
      setTimeout(() => setProfileMessage(null), 3000)
    }
  }

  const handleChangePassword = async () => {
    setPasswordMessage(null)
    if (password.newPassword !== password.confirmPassword) {
      setPasswordMessage('New passwords do not match')
      setTimeout(() => setPasswordMessage(null), 3000)
      return
    }
    if (password.newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters')
      setTimeout(() => setPasswordMessage(null), 3000)
      return
    }
    setChangingPassword(true)
    try {
      await api.user.updatePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      })
      setPasswordMessage('Password changed successfully!')
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordMessage(null), 3000)
    } catch (error: any) {
      setPasswordMessage(error.message || 'Failed to change password')
      setTimeout(() => setPasswordMessage(null), 3000)
    } finally {
      setChangingPassword(false)
    }
  }

  const loadSmtp = async () => {
    try {
      const data = await api.settings.getSmtp()
      if (data.host) {
        setSmtp({ ...smtp, ...data })
      }
    } catch (error) {
      console.error('Failed to load SMTP settings:', error)
    }
  }

  const handleSaveSmtp = async () => {
    try {
      await api.settings.saveSmtp(smtp)
      setTestResult('Settings saved!')
      setTimeout(() => setTestResult(null), 3000)
    } catch (error) {
      setTestResult('Failed to save settings')
      setTimeout(() => setTestResult(null), 3000)
    }
  }

  const handleTestSmtp = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await api.settings.testSmtp()
      setTestResult('Test email sent successfully!')
    } catch (error) {
      setTestResult('Failed to send test email')
    } finally {
      setTesting(false)
      setTimeout(() => setTestResult(null), 5000)
    }
  }

  return (
    <div className="min-h-dvh bg-background p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="flex-1" />
        <Button variant="ghost" onClick={async () => { await logout(); router.push('/login') }}>
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your email and name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="your-email@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                {profileMessage && (
                  <div className={`p-3 rounded-md text-sm ${
                    profileMessage.includes('success') 
                      ? 'bg-green-500/10 text-green-600' 
                      : 'bg-red-500/10 text-red-600'
                  }`}>
                    {profileMessage}
                  </div>
                )}
                <Button onClick={handleUpdateProfile} className="w-full">
                  Update Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Current Password</label>
              <Input
                type="password"
                value={password.currentPassword}
                onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">New Password</label>
              <Input
                type="password"
                value={password.newPassword}
                onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
              <Input
                type="password"
                value={password.confirmPassword}
                onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
            {passwordMessage && (
              <div className={`p-3 rounded-md text-sm ${
                passwordMessage.includes('success') 
                  ? 'bg-green-500/10 text-green-600' 
                  : 'bg-red-500/10 text-red-600'
              }`}>
                {passwordMessage}
              </div>
            )}
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword}
              className="w-full"
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Couple Information</CardTitle>
            <CardDescription>View your linked couple</CardDescription>
          </CardHeader>
          <CardContent>
            {coupleLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : couple ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Couple Code</div>
                  <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                    {couple.code}
                  </div>
                </div>
                {couple.partner ? (
                  <div>
                    <div className="text-sm font-medium mb-1">Linked Partner</div>
                    <div className="text-sm text-muted-foreground">
                      <div className="font-semibold">{couple.partner.name}</div>
                      <div className="text-xs">{couple.partner.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No partner linked yet. Share your couple code with your partner to link accounts.
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Linked on {new Date(couple.createdAt).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  You are not linked to a couple yet.
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Create couple and show code
                    api.couple.create().then((data) => {
                      loadCouple()
                      alert(`Couple created! Share this code with your partner: ${data.code}`)
                    }).catch((err) => {
                      alert('Failed to create couple: ' + err.message)
                    })
                  }}
                >
                  Create Couple
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMTP Configuration</CardTitle>
            <CardDescription>Configure email settings for reminders and invitations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Host</label>
                <Input
                  value={smtp.host}
                  onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Port</label>
                <Input
                  type="number"
                  value={smtp.port}
                  onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) || 587 })}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={smtp.secure}
                  onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Use TLS/SSL</span>
              </label>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Username</label>
              <Input
                value={smtp.username}
                onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                placeholder="your-email@gmail.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Password</label>
              <Input
                type="password"
                value={smtp.password}
                onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                placeholder="App password or account password"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">From Name</label>
                <Input
                  value={smtp.fromName}
                  onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
                  placeholder="WeTime"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">From Email</label>
                <Input
                  type="email"
                  value={smtp.fromEmail}
                  onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })}
                  placeholder="noreply@example.com"
                />
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-md text-sm ${testResult.includes('success') ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                {testResult}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSaveSmtp} className="flex-1">
                Save Settings
              </Button>
              <Button onClick={handleTestSmtp} disabled={testing} variant="outline" className="flex-1">
                {testing ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendars</CardTitle>
            <CardDescription>Manage your calendars</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => router.push('/calendars')}>
              Manage Calendars
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

