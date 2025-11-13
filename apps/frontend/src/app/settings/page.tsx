'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, LogOut } from 'lucide-react'
import { ThemeSelect } from '@/components/theme-toggle'

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

  const [aiSettings, setAiSettings] = useState({
    ollamaUrl: '',
    selectedModel: '',
    useCpu: false,
  })
  const [aiModels, setAiModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [aiMessage, setAiMessage] = useState<string | null>(null)

  const [notificationPrefs, setNotificationPrefs] = useState({
    reminderMinutesBefore: null as number | null,
    notifyEmail: true,
    notifyWeb: true,
  })
  const [notificationPrefsLoading, setNotificationPrefsLoading] = useState(true)
  const [notificationPrefsMessage, setNotificationPrefsMessage] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
    loadCouple()
    loadSmtp()
    loadAiSettings()
    loadNotificationPrefs()
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

  const loadAiSettings = async () => {
    try {
      const data = await api.aiAssistant.getSettings()
      setAiSettings({
        ollamaUrl: data.ollamaUrl || '',
        selectedModel: data.selectedModel || '',
        useCpu: data.useCpu || false,
      })
    } catch (error) {
      console.error('Failed to load AI settings:', error)
    }
  }

  const handleTestOllamaConnection = async () => {
    if (!aiSettings.ollamaUrl) {
      setAiMessage('Please enter an Ollama URL first')
      setTimeout(() => setAiMessage(null), 3000)
      return
    }

    setLoadingModels(true)
    setAiMessage(null)
    try {
      const data = await api.aiAssistant.getModels(aiSettings.ollamaUrl)
      setAiModels(data.models || [])
      setAiMessage(`Found ${data.models?.length || 0} models`)
      setTimeout(() => setAiMessage(null), 3000)
    } catch (error: any) {
      setAiMessage(error.message || 'Failed to connect to Ollama')
      setAiModels([])
      setTimeout(() => setAiMessage(null), 5000)
    } finally {
      setLoadingModels(false)
    }
  }

  const handleSaveAiSettings = async () => {
    if (!aiSettings.ollamaUrl) {
      setAiMessage('Ollama URL is required')
      setTimeout(() => setAiMessage(null), 3000)
      return
    }

    try {
      await api.aiAssistant.saveSettings({
        ollamaUrl: aiSettings.ollamaUrl,
        selectedModel: aiSettings.selectedModel || undefined,
        useCpu: aiSettings.useCpu,
      })
      setAiMessage('Settings saved successfully!')
      setTimeout(() => setAiMessage(null), 3000)
    } catch (error: any) {
      setAiMessage(error.message || 'Failed to save settings')
      setTimeout(() => setAiMessage(null), 3000)
    }
  }

  const loadNotificationPrefs = async () => {
    try {
      const data = await api.settings.getNotifications()
      setNotificationPrefs({
        reminderMinutesBefore: data.reminderMinutesBefore,
        notifyEmail: data.notifyEmail,
        notifyWeb: data.notifyWeb,
      })
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    } finally {
      setNotificationPrefsLoading(false)
    }
  }

  const handleSaveNotificationPrefs = async () => {
    setNotificationPrefsMessage(null)
    try {
      await api.settings.updateNotifications(notificationPrefs)
      setNotificationPrefsMessage('Notification preferences saved successfully!')
      setTimeout(() => setNotificationPrefsMessage(null), 3000)
    } catch (error: any) {
      setNotificationPrefsMessage(error.message || 'Failed to save preferences')
      setTimeout(() => setNotificationPrefsMessage(null), 3000)
    }
  }

  const formatReminderTime = (minutes: number | null) => {
    if (minutes === null) return 'Disabled'
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) !== 1 ? 's' : ''}`
    return `${Math.floor(minutes / 1440)} day${Math.floor(minutes / 1440) !== 1 ? 's' : ''}`
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
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelect />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Configure when and how you receive event reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationPrefsLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div>
                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.reminderMinutesBefore !== null}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNotificationPrefs({ ...notificationPrefs, reminderMinutesBefore: 15 })
                        } else {
                          setNotificationPrefs({ ...notificationPrefs, reminderMinutesBefore: null })
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Enable reminders</span>
                  </label>
                  <p className="text-xs text-muted-foreground ml-6">
                    When enabled, you'll receive reminders before events start
                  </p>
                </div>

                {notificationPrefs.reminderMinutesBefore !== null && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Reminder time (minutes before event)</label>
                      <Input
                        type="number"
                        min="1"
                        value={notificationPrefs.reminderMinutesBefore || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          if (!isNaN(val) && val > 0) {
                            setNotificationPrefs({ ...notificationPrefs, reminderMinutesBefore: val })
                          }
                        }}
                        placeholder="15"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Current: {formatReminderTime(notificationPrefs.reminderMinutesBefore)} before event
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[15, 30, 60, 120, 1440, 10080].map((mins) => (
                          <Button
                            key={mins}
                            variant={notificationPrefs.reminderMinutesBefore === mins ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNotificationPrefs({ ...notificationPrefs, reminderMinutesBefore: mins })}
                          >
                            {formatReminderTime(mins)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={notificationPrefs.notifyEmail}
                            onChange={(e) => setNotificationPrefs({ ...notificationPrefs, notifyEmail: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">Email notifications</span>
                        </label>
                        <p className="text-xs text-muted-foreground ml-6">
                          Receive reminders via email (requires SMTP configuration)
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={notificationPrefs.notifyWeb}
                            onChange={(e) => setNotificationPrefs({ ...notificationPrefs, notifyWeb: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">Web notifications</span>
                        </label>
                        <p className="text-xs text-muted-foreground ml-6">
                          Receive in-app notifications
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {notificationPrefsMessage && (
                  <div className={`p-3 rounded-md text-sm ${
                    notificationPrefsMessage.includes('success')
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-red-500/10 text-red-600'
                  }`}>
                    {notificationPrefsMessage}
                  </div>
                )}

                <Button onClick={handleSaveNotificationPrefs} className="w-full">
                  Save Notification Preferences
                </Button>
              </>
            )}
          </CardContent>
        </Card>

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
            <CardTitle>AI Assistant (Ollama)</CardTitle>
            <CardDescription>Configure your AI assistant settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Ollama URL</label>
              <Input
                value={aiSettings.ollamaUrl}
                onChange={(e) => setAiSettings({ ...aiSettings, ollamaUrl: e.target.value })}
                placeholder="http://localhost:11434"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Model</label>
              <div className="flex gap-2">
                <select
                  value={aiSettings.selectedModel}
                  onChange={(e) => setAiSettings({ ...aiSettings, selectedModel: e.target.value })}
                  className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                  disabled={aiModels.length === 0}
                >
                  <option value="">Select a model...</option>
                  {aiModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleTestOllamaConnection}
                  disabled={loadingModels || !aiSettings.ollamaUrl}
                  variant="outline"
                >
                  {loadingModels ? 'Loading...' : 'Load Models'}
                </Button>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={aiSettings.useCpu}
                  onChange={(e) => setAiSettings({ ...aiSettings, useCpu: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Force CPU mode (use if you get CUDA/GPU errors)</span>
              </label>
            </div>

            {aiMessage && (
              <div className={`p-3 rounded-md text-sm ${
                aiMessage.includes('success') || aiMessage.includes('Found')
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-red-500/10 text-red-600'
              }`}>
                {aiMessage}
              </div>
            )}

            <Button onClick={handleSaveAiSettings} className="w-full">
              Save AI Settings
            </Button>
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

