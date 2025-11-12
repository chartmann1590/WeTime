'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { ArrowLeft, Plus, RefreshCw, Trash2, ExternalLink } from 'lucide-react'

export default function CalendarsPage() {
  const router = useRouter()
  const [calendars, setCalendars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newCalendar, setNewCalendar] = useState({
    type: 'EXTERNAL' as 'EXTERNAL' | 'PERSONAL',
    name: '',
    color: '#3b82f6',
    icsUrl: '',
  })

  useEffect(() => {
    loadCalendars()
  }, [])

  const loadCalendars = async () => {
    try {
      const res = await api.calendars.list()
      setCalendars(res.calendars || [])
    } catch (error) {
      console.error('Failed to load calendars:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await api.calendars.create(newCalendar)
      setShowAdd(false)
      setNewCalendar({ type: 'EXTERNAL', name: '', color: '#3b82f6', icsUrl: '' })
      loadCalendars()
    } catch (error) {
      console.error('Failed to create calendar:', error)
    }
  }

  const handleRefresh = async (id: string) => {
    try {
      await api.calendars.refresh(id)
      loadCalendars()
    } catch (error) {
      console.error('Failed to refresh calendar:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this calendar? Events will be removed.')) return
    try {
      await api.calendars.delete(id)
      loadCalendars()
    } catch (error) {
      console.error('Failed to delete calendar:', error)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await api.calendars.import(file)
      loadCalendars()
    } catch (error) {
      console.error('Failed to import calendar:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Calendars</h1>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Import Calendar</CardTitle>
            <CardDescription>Upload a .ics file to import events</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".ics"
              onChange={handleImport}
              className="w-full text-sm"
            />
          </CardContent>
        </Card>

        {showAdd && (
          <Card>
            <CardHeader>
              <CardTitle>Add Calendar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <select
                  value={newCalendar.type}
                  onChange={(e) => setNewCalendar({ ...newCalendar, type: e.target.value as any })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="EXTERNAL">External (iCal URL)</option>
                  <option value="PERSONAL">Personal</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar({ ...newCalendar, name: e.target.value })}
                  placeholder="Calendar name"
                />
              </div>
              {newCalendar.type === 'EXTERNAL' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">iCal URL</label>
                  <Input
                    value={newCalendar.icsUrl}
                    onChange={(e) => setNewCalendar({ ...newCalendar, icsUrl: e.target.value })}
                    placeholder="https://example.com/calendar.ics"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1">Add</Button>
                <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!showAdd && (
          <Button onClick={() => setShowAdd(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Calendar
          </Button>
        )}

        <div className="space-y-2">
          {calendars.map((cal) => (
            <Card key={cal.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: cal.color }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{cal.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{cal.type.toLowerCase()}</p>
                      {cal.icsUrl && (
                        <a
                          href={cal.exportUrl || api.calendars.export(cal.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Export iCal
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {cal.type === 'EXTERNAL' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRefresh(cal.id)}
                        title="Refresh"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cal.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

