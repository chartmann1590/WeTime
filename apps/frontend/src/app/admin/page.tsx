'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, Plus, Edit, Trash2, Users, Calendar, CalendarDays, Heart, Trash, LogOut } from 'lucide-react'

type Tab = 'users' | 'calendars' | 'events' | 'couples' | 'cleanup'

export default function AdminPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Users state
  const [users, setUsers] = useState<any[]>([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [userForm, setUserForm] = useState({ email: '', password: '', name: '', isAdmin: false, timeZone: 'America/New_York' })
  
  // Calendars state
  const [calendars, setCalendars] = useState<any[]>([])
  const [showCalendarForm, setShowCalendarForm] = useState(false)
  const [editingCalendar, setEditingCalendar] = useState<any>(null)
  const [calendarForm, setCalendarForm] = useState({ ownerId: '', coupleId: '', type: 'PERSONAL' as any, name: '', color: '#3b82f6', icsUrl: '' })
  
  // Events state
  const [events, setEvents] = useState<any[]>([])
  const [eventsOffset, setEventsOffset] = useState(0)
  const [eventsTotal, setEventsTotal] = useState(0)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [eventForm, setEventForm] = useState({ calendarId: '', title: '', description: '', location: '', startsAtUtc: '', endsAtUtc: '', allDay: false, createdById: '' })
  
  // Couples state
  const [couples, setCouples] = useState<any[]>([])

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [activeTab, isAdmin, eventsOffset])

  const checkAdmin = async () => {
    try {
      const profile = await api.user.getProfile()
      console.log('Admin check profile:', JSON.stringify(profile, null, 2))
      const isUserAdmin = profile?.user?.isAdmin === true
      console.log('isAdmin value:', profile?.user?.isAdmin, 'check result:', isUserAdmin)
      if (isUserAdmin) {
        setIsAdmin(true)
      } else {
        console.log('User is not admin, redirecting...')
        router.push('/')
      }
    } catch (error) {
      console.error('Admin check error:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      switch (activeTab) {
        case 'users':
          const usersRes = await api.admin.users.list()
          setUsers(usersRes.users || [])
          break
        case 'calendars':
          const calendarsRes = await api.admin.calendars.list()
          setCalendars(calendarsRes.calendars || [])
          break
        case 'events':
          const eventsRes = await api.admin.events.list(50, eventsOffset)
          setEvents(eventsRes.events || [])
          setEventsTotal(eventsRes.total || 0)
          break
        case 'couples':
          const couplesRes = await api.admin.couples.list()
          setCouples(couplesRes.couples || [])
          break
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('Failed to load data. Make sure you are an admin.')
    }
  }

  const handleCreateUser = async () => {
    try {
      await api.admin.users.create(userForm)
      setShowUserForm(false)
      setUserForm({ email: '', password: '', name: '', isAdmin: false, timeZone: 'America/New_York' })
      loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to create user')
    }
  }

  const handleUpdateUser = async () => {
    try {
      const data: any = { ...userForm }
      if (!data.password) delete data.password
      await api.admin.users.update(editingUser.id, data)
      setEditingUser(null)
      setUserForm({ email: '', password: '', name: '', isAdmin: false, timeZone: 'America/New_York' })
      loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user? This will also delete all their calendars and events.')) return
    try {
      await api.admin.users.delete(id)
      loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to delete user')
    }
  }

  const handleCreateCalendar = async () => {
    try {
      const data: any = { ...calendarForm }
      if (!data.ownerId) delete data.ownerId
      if (!data.coupleId) delete data.coupleId
      if (!data.icsUrl) delete data.icsUrl
      await api.admin.calendars.create(data)
      setShowCalendarForm(false)
      setCalendarForm({ ownerId: '', coupleId: '', type: 'PERSONAL', name: '', color: '#3b82f6', icsUrl: '' })
      loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to create calendar')
    }
  }

  const handleUpdateCalendar = async () => {
    try {
      const data: any = { ...calendarForm }
      if (!data.ownerId) data.ownerId = null
      if (!data.coupleId) data.coupleId = null
      if (!data.icsUrl) data.icsUrl = null
      await api.admin.calendars.update(editingCalendar.id, data)
      setEditingCalendar(null)
      setCalendarForm({ ownerId: '', coupleId: '', type: 'PERSONAL', name: '', color: '#3b82f6', icsUrl: '' })
      loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to update calendar')
    }
  }

  const handleDeleteCalendar = async (id: string) => {
    if (!confirm('Delete this calendar? This will also delete all events in it.')) return
    try {
      await api.admin.calendars.delete(id)
      loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to delete calendar')
    }
  }

  const handleCreateEvent = async () => {
    try {
      const data = {
        ...eventForm,
        startsAtUtc: new Date(eventForm.startsAtUtc).toISOString(),
        endsAtUtc: new Date(eventForm.endsAtUtc).toISOString(),
      }
      await api.admin.events.create(data)
      setShowEventForm(false)
      setEventForm({ calendarId: '', title: '', description: '', location: '', startsAtUtc: '', endsAtUtc: '', allDay: false, createdById: '' })
      loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to create event')
    }
  }

  const handleUpdateEvent = async () => {
    try {
      const data: any = { ...eventForm }
      if (data.startsAtUtc) data.startsAtUtc = new Date(data.startsAtUtc).toISOString()
      if (data.endsAtUtc) data.endsAtUtc = new Date(data.endsAtUtc).toISOString()
      await api.admin.events.update(editingEvent.id, data)
      setEditingEvent(null)
      setEventForm({ calendarId: '', title: '', description: '', location: '', startsAtUtc: '', endsAtUtc: '', allDay: false, createdById: '' })
      loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to update event')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    try {
      await api.admin.events.delete(id)
      loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to delete event')
    }
  }

  const handleDeleteCouple = async (id: string) => {
    if (!confirm('Delete this couple? This will unlink the users.')) return
    try {
      await api.admin.couples.delete(id)
      loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to delete couple')
    }
  }

  const handleCleanupDuplicates = async () => {
    if (!confirm('Remove all duplicate events? This cannot be undone.')) return
    try {
      const result = await api.admin.cleanupDuplicates()
      alert(`Success! Removed ${result.deleted} duplicate events from ${result.duplicateGroups} groups.`)
      if (activeTab === 'events') loadData()
    } catch (error: any) {
      alert(error.message || 'Failed to cleanup duplicates')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!isAdmin) {
    return <div className="p-8">Access denied. Admin privileges required.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Administration</h1>
          <div className="flex-1" />
          <Button variant="ghost" onClick={async () => { await logout(); router.push('/login') }}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="rounded-b-none"
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </Button>
          <Button
            variant={activeTab === 'calendars' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('calendars')}
            className="rounded-b-none"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendars
          </Button>
          <Button
            variant={activeTab === 'events' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('events')}
            className="rounded-b-none"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Events
          </Button>
          <Button
            variant={activeTab === 'couples' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('couples')}
            className="rounded-b-none"
          >
            <Heart className="w-4 h-4 mr-2" />
            Couples
          </Button>
          <Button
            variant={activeTab === 'cleanup' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('cleanup')}
            className="rounded-b-none"
          >
            <Trash className="w-4 h-4 mr-2" />
            Cleanup
          </Button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Users</h2>
              <Button onClick={() => { setShowUserForm(true); setEditingUser(null); setUserForm({ email: '', password: '', name: '', isAdmin: false, timeZone: 'America/New_York' }) }}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            {showUserForm && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>{editingUser ? 'Edit User' : 'New User'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                  <Input
                    placeholder={editingUser ? "New Password (leave empty to keep current)" : "Password"}
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                  <Input
                    placeholder="Name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  />
                  <Input
                    placeholder="Time Zone"
                    value={userForm.timeZone}
                    onChange={(e) => setUserForm({ ...userForm, timeZone: e.target.value })}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={userForm.isAdmin}
                      onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                    />
                    Admin
                  </label>
                  <div className="flex gap-2">
                    <Button onClick={editingUser ? handleUpdateUser : handleCreateUser}>Save</Button>
                    <Button variant="outline" onClick={() => { setShowUserForm(false); setEditingUser(null) }}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{user.name} {user.isAdmin && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">Calendars: {user._count?.calendars || 0} | Events: {user._count?.events || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user)
                            setUserForm({ email: user.email, password: '', name: user.name, isAdmin: user.isAdmin, timeZone: user.timeZone || 'America/New_York' })
                            setShowUserForm(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Calendars Tab */}
        {activeTab === 'calendars' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Calendars</h2>
              <Button onClick={() => { setShowCalendarForm(true); setEditingCalendar(null); setCalendarForm({ ownerId: '', coupleId: '', type: 'PERSONAL', name: '', color: '#3b82f6', icsUrl: '' }) }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Calendar
              </Button>
            </div>

            {showCalendarForm && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>{editingCalendar ? 'Edit Calendar' : 'New Calendar'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Name"
                    value={calendarForm.name}
                    onChange={(e) => setCalendarForm({ ...calendarForm, name: e.target.value })}
                  />
                  <select
                    className="w-full p-2 border rounded"
                    value={calendarForm.type}
                    onChange={(e) => setCalendarForm({ ...calendarForm, type: e.target.value as any })}
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="SHARED">Shared</option>
                    <option value="EXTERNAL">External</option>
                    <option value="IMPORTED">Imported</option>
                  </select>
                  <Input
                    placeholder="Owner ID (optional)"
                    value={calendarForm.ownerId}
                    onChange={(e) => setCalendarForm({ ...calendarForm, ownerId: e.target.value })}
                  />
                  <Input
                    placeholder="Couple ID (optional)"
                    value={calendarForm.coupleId}
                    onChange={(e) => setCalendarForm({ ...calendarForm, coupleId: e.target.value })}
                  />
                  <Input
                    placeholder="Color"
                    type="color"
                    value={calendarForm.color}
                    onChange={(e) => setCalendarForm({ ...calendarForm, color: e.target.value })}
                  />
                  <Input
                    placeholder="ICS URL (for external calendars)"
                    value={calendarForm.icsUrl}
                    onChange={(e) => setCalendarForm({ ...calendarForm, icsUrl: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button onClick={editingCalendar ? handleUpdateCalendar : handleCreateCalendar}>Save</Button>
                    <Button variant="outline" onClick={() => { setShowCalendarForm(false); setEditingCalendar(null) }}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {calendars.map((cal) => (
                <Card key={cal.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: cal.color }}></div>
                          {cal.name}
                        </h3>
                        <p className="text-sm text-gray-600">{cal.type}</p>
                        {cal.owner && <p className="text-xs text-gray-500">Owner: {cal.owner.name} ({cal.owner.email})</p>}
                        {cal.couple && <p className="text-xs text-gray-500">Couple: {cal.couple.code}</p>}
                        <p className="text-xs text-gray-500">Events: {cal._count?.events || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCalendar(cal)
                            setCalendarForm({ ownerId: cal.ownerId || '', coupleId: cal.coupleId || '', type: cal.type, name: cal.name, color: cal.color, icsUrl: cal.icsUrl || '' })
                            setShowCalendarForm(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCalendar(cal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Events ({eventsTotal})</h2>
              <Button onClick={() => { setShowEventForm(true); setEditingEvent(null); setEventForm({ calendarId: '', title: '', description: '', location: '', startsAtUtc: '', endsAtUtc: '', allDay: false, createdById: '' }) }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>

            {showEventForm && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>{editingEvent ? 'Edit Event' : 'New Event'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Calendar ID"
                    value={eventForm.calendarId}
                    onChange={(e) => setEventForm({ ...eventForm, calendarId: e.target.value })}
                  />
                  <Input
                    placeholder="Title"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  />
                  <Input
                    placeholder="Location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  />
                  <Input
                    placeholder="Start (ISO string)"
                    type="datetime-local"
                    value={eventForm.startsAtUtc ? new Date(eventForm.startsAtUtc).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEventForm({ ...eventForm, startsAtUtc: new Date(e.target.value).toISOString() })}
                  />
                  <Input
                    placeholder="End (ISO string)"
                    type="datetime-local"
                    value={eventForm.endsAtUtc ? new Date(eventForm.endsAtUtc).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEventForm({ ...eventForm, endsAtUtc: new Date(e.target.value).toISOString() })}
                  />
                  <Input
                    placeholder="Created By User ID"
                    value={eventForm.createdById}
                    onChange={(e) => setEventForm({ ...eventForm, createdById: e.target.value })}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={eventForm.allDay}
                      onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                    />
                    All Day
                  </label>
                  <div className="flex gap-2">
                    <Button onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}>Save</Button>
                    <Button variant="outline" onClick={() => { setShowEventForm(false); setEditingEvent(null) }}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.startsAtUtc).toLocaleString()} - {new Date(event.endsAtUtc).toLocaleString()}
                        </p>
                        {event.calendar && <p className="text-xs text-gray-500">Calendar: {event.calendar.name}</p>}
                        {event.createdBy && <p className="text-xs text-gray-500">Created by: {event.createdBy.name}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(event)
                            setEventForm({
                              calendarId: event.calendarId,
                              title: event.title,
                              description: event.description || '',
                              location: event.location || '',
                              startsAtUtc: event.startsAtUtc,
                              endsAtUtc: event.endsAtUtc,
                              allDay: event.allDay,
                              createdById: event.createdById,
                            })
                            setShowEventForm(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" disabled={eventsOffset === 0} onClick={() => setEventsOffset(Math.max(0, eventsOffset - 50))}>
                Previous
              </Button>
              <Button variant="outline" disabled={eventsOffset + 50 >= eventsTotal} onClick={() => setEventsOffset(eventsOffset + 50)}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Couples Tab */}
        {activeTab === 'couples' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Couples</h2>
            </div>

            <div className="grid gap-4">
              {couples.map((couple) => (
                <Card key={couple.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Code: {couple.code}</h3>
                        <p className="text-sm text-gray-600">Users: {couple.users.map((u: any) => u.name).join(', ')}</p>
                        <p className="text-xs text-gray-500">Calendars: {couple._count?.calendars || 0}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCouple(couple.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cleanup Tab */}
        {activeTab === 'cleanup' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Cleanup Duplicate Events</CardTitle>
                <CardDescription>
                  Remove events that have the same calendar, start time, end time, and title. The oldest event will be kept.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleCleanupDuplicates}>
                  <Trash className="w-4 h-4 mr-2" />
                  Remove Duplicate Events
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

