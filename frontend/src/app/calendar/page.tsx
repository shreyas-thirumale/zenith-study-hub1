'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import { CalendarView } from '@/components/calendar-view'
import { Navbar } from '@/components/navbar'
import { AddCourseDialog } from '@/components/add-course-dialog'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface CalendarEvent {
  id: number
  title: string
  description?: string
  date: string
  time?: string
  type: string
  course_id?: number
}

interface Course {
  id: number
  name: string
  code: string
  color: string
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'assignment',
    course_id: ''
  })

  useEffect(() => {
    loadEvents()
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses')
      setCourses(response.data)
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await api.get('/calendar')
      setEvents(response.data)
    } catch (error) {
      toast.error('Failed to load calendar events')
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.date) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      const eventData = {
        ...formData,
        course_id: formData.course_id && formData.course_id !== "none" ? parseInt(formData.course_id) : null
      }
      console.log('Creating event:', eventData)
      const response = await api.post('/calendar', eventData)
      console.log('Event created:', response.data)
      setEvents([...events, response.data])
      toast.success('Event added successfully!')
      setIsDialogOpen(false)
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        type: 'assignment',
        course_id: ''
      })
    } catch (error: any) {
      console.error('Error creating event:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.error || 'Failed to add event')
    }
  }

  const handleDeleteEvent = async (id: number) => {
    try {
      console.log('Deleting event:', id)
      await api.delete(`/calendar/${id}`)
      console.log('Event deleted successfully')
      setEvents(events.filter(e => e.id !== id))
      toast.success('Event deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting event:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.error || 'Failed to delete event')
    }
  }

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return []
    const dateStr = selectedDate.toISOString().split('T')[0]
    return events.filter(event => event.date === dateStr)
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'exam':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'presentation':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const selectedDateEvents = getEventsForSelectedDate()

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Calendar" />
      
      {/* Action Bar */}
      <div className="bg-card/30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">Manage your assignments and events</p>
            <Button className="hover-lift" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <Card className="modern-card animate-scale-in">
                <CardContent className="p-6">
                  <CalendarView
                    events={events}
                    onDateClick={handleDateClick}
                    {...(selectedDate && { selectedDate })}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Events Sidebar */}
            <div className="space-y-4">
              <Card className="modern-card animate-slide-left">
                <CardHeader>
                  <CardTitle>
                    {selectedDate
                      ? `Events on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : 'Select a date'}
                  </CardTitle>
                  <CardDescription>
                    {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No events on this date</p>
                    </div>
                  ) : (
                    selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            {event.time && (
                              <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-2">{event.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="modern-card animate-slide-left animate-stagger-1">
                <CardHeader>
                  <CardTitle className="text-sm">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Events</span>
                    <span className="font-medium">{events.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Assignments</span>
                    <span className="font-medium text-blue-600">
                      {events.filter(e => e.type === 'assignment').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Exams</span>
                    <span className="font-medium text-red-600">
                      {events.filter(e => e.type === 'exam').length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Add Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new calendar event for your assignments, exams, or other activities.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEvent}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Math Assignment Due"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select
                  value={formData.course_id || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, course_id: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No course</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AddCourseDialog
                  onCourseAdded={(newCourse) => {
                    setCourses([...courses, newCourse]);
                    setFormData({ ...formData, course_id: newCourse.id.toString() });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="hover-lift">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}