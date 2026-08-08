'use client'

import { useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

import { Flag } from 'lucide-react'

interface Course {
  id: string
  name: string
  code: string
  color: string
  days: string[]
  start_time: string | null
  end_time: string | null
  location: string | null
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: string
  description?: string
  course_id?: string
}

interface Project {
  id: string
  name: string
  due_date?: string
  status: string
}

interface WeeklyViewProps {
  courses: Course[]
  events: CalendarEvent[]
  projects?: Project[]
  currentWeekStart: Date
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
  onSlotClick: (_date: Date, _hour: number) => void
}

const DAY_LABELS: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_HEIGHT = 60 // px per hour

function timeToMinutes(t: string): number {
  const parts = t.split(':').map(Number)
  const h = parts[0] ?? 0
  const m = parts[1] ?? 0
  return h * 60 + m
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function getDayKey(dayIndex: number): string {
  return DAY_LABELS[dayIndex] ?? 'Sun'
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  assignment:   'bg-white/10 border-white/40 text-foreground',
  exam:         'bg-destructive/20 border-destructive text-destructive-foreground',
  presentation: 'bg-white/15 border-white/50 text-foreground',
  reading:      'bg-white/8 border-white/30 text-foreground',
  custom:       'bg-white/5 border-white/20 text-muted-foreground',
}

export function WeeklyView({
  courses,
  events,
  projects = [],
  currentWeekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  onSlotClick,
}: WeeklyViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to 7 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * SLOT_HEIGHT
    }
  }, [])

  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart)
    d.setDate(currentWeekStart.getDate() + i)
    return d
  })

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const monthNames: string[] = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ]

  // Derive week label — weekDays always has 7 elements so these casts are safe
  const firstDay = weekDays[0] as Date
  const lastDay  = weekDays[6] as Date
  const weekLabel =
    firstDay.getMonth() === lastDay.getMonth()
      ? `${monthNames[firstDay.getMonth()] ?? ''} ${firstDay.getFullYear()}`
      : `${monthNames[firstDay.getMonth()] ?? ''} – ${monthNames[lastDay.getMonth()] ?? ''} ${lastDay.getFullYear()}`

  // Current time indicator position
  const nowMinutes = today.getHours() * 60 + today.getMinutes()
  const nowTop = (nowMinutes / 60) * SLOT_HEIGHT

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToday} className="hover-lift text-xs px-3">
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 hover-lift" onClick={onPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 hover-lift" onClick={onNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{weekLabel}</h2>
        <div className="w-32" />
      </div>

      {/* Day header row — includes deadline badges */}
      <div className="flex border-b border-border/50">
        <div className="w-14 shrink-0" />
        {weekDays.map((day, i) => {
          const dateStr = day.toISOString().split('T')[0]
          const isToday = dateStr === todayStr
          const dayDeadlines = projects.filter(
            p => p.due_date === dateStr && p.status !== 'archived'
          )
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-border/30">
              <div className="text-xs text-muted-foreground font-medium">
                {DAY_LABELS[i] ?? ''}
              </div>
              <div className={`
                text-sm font-bold mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full
                ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}
              `}>
                {day.getDate()}
              </div>
              {/* Deadline badges in header */}
              {dayDeadlines.length > 0 && (
                <div className="mt-1 space-y-0.5 px-1">
                  {dayDeadlines.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center gap-1 text-[10px] bg-destructive/15 border border-destructive/30 text-destructive rounded px-1 py-0.5 truncate"
                      title={`Due: ${p.name}`}
                    >
                      <Flag className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="flex" style={{ height: `${SLOT_HEIGHT * 24}px` }}>
          {/* Time gutter */}
          <div className="w-14 shrink-0 relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 text-xs text-muted-foreground"
                style={{ top: h * SLOT_HEIGHT - 8, height: SLOT_HEIGHT }}
              >
                {h === 0 ? '' : formatHour(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, colIdx) => {
            const dateStr = day.toISOString().split('T')[0]
            const isToday = dateStr === todayStr
            const dayKey: string = getDayKey(day.getDay())

            // Recurring class blocks for this day
            const classBlocks = courses.filter(c =>
              Array.isArray(c.days) &&
              c.days.includes(dayKey) &&
              c.start_time != null &&
              c.end_time != null
            )

            // One-off events for this day that have a time
            const dayEvents = events.filter(e => e.date === dateStr && e.time)

            return (
              <div
                key={colIdx}
                className="flex-1 border-l border-border/30 relative"
                style={{ height: `${SLOT_HEIGHT * 24}px` }}
              >
                {/* Hour grid lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-border/20 cursor-pointer hover:bg-accent/10 transition-colors"
                    style={{ top: h * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                    onClick={() => onSlotClick(day, h)}
                  />
                ))}

                {/* Half-hour lines */}
                {HOURS.map(h => (
                  <div
                    key={`half-${h}`}
                    className="absolute w-full border-t border-border/10"
                    style={{ top: h * SLOT_HEIGHT + SLOT_HEIGHT / 2, height: 0 }}
                  />
                ))}

                {/* Today indicator */}
                {isToday && (
                  <div
                    className="absolute w-full z-20 pointer-events-none"
                    style={{ top: nowTop }}
                  >
                    <div className="relative flex items-center">
                      <div className="w-2 h-2 rounded-full bg-destructive -ml-1 shrink-0" />
                      <div className="flex-1 h-px bg-destructive" />
                    </div>
                  </div>
                )}

                {/* Recurring class blocks */}
                {classBlocks.map(course => {
                  const startMin = timeToMinutes(course.start_time as string)
                  const endMin   = timeToMinutes(course.end_time as string)
                  const top      = (startMin / 60) * SLOT_HEIGHT
                  const height   = ((endMin - startMin) / 60) * SLOT_HEIGHT

                  return (
                    <div
                      key={`course-${course.id}`}
                      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-xs overflow-hidden z-10 border-l-2 cursor-pointer transition-opacity hover:opacity-90"
                      style={{
                        top: top + 1,
                        height: Math.max(height - 2, 20),
                        backgroundColor: course.color + '30',
                        borderColor: course.color,
                        color: course.color,
                      }}
                      title={`${course.name} (${course.code})\n${course.start_time} – ${course.end_time}${course.location ? '\n' + course.location : ''}`}
                    >
                      <div className="font-semibold truncate leading-tight">{course.code}</div>
                      {height > 36 && (
                        <div className="truncate opacity-80 leading-tight">{course.name}</div>
                      )}
                      {height > 52 && course.location && (
                        <div className="truncate opacity-60 leading-tight">{course.location}</div>
                      )}
                    </div>
                  )
                })}

                {/* One-off timed events */}
                {dayEvents.map(event => {
                  const startMin   = timeToMinutes(event.time as string)
                  const top        = (startMin / 60) * SLOT_HEIGHT
                  const colorClass = EVENT_TYPE_COLORS[event.type] ?? EVENT_TYPE_COLORS['custom'] ?? ''

                  return (
                    <div
                      key={`event-${event.id}`}
                      className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-xs z-10 border-l-2 cursor-pointer transition-opacity hover:opacity-90 ${colorClass}`}
                      style={{ top: top + 1, height: 28 }}
                      title={event.title}
                    >
                      <div className="font-medium truncate leading-tight">{event.title}</div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
