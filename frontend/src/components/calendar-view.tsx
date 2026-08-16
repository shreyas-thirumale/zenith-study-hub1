'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: string
  description?: string
}

interface CalendarViewProps {
  events: CalendarEvent[]
  onDateClick: (date: Date) => void
  selectedDate?: Date
}

export function CalendarView({ events, onDateClick, selectedDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(event => event.date === dateStr)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    )
  }

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    onDateClick(date)
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-white'
      case 'exam':
        return 'bg-white/50'
      case 'presentation':
        return 'bg-white/70'
      default:
        return 'bg-white/30'
    }
  }

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousMonth}
            className="hover-lift"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="hover-lift"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Names */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Calendar Days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const dayEvents = getEventsForDate(day)
          const today = isToday(day)
          const selected = isSelected(day)

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square p-2 rounded-lg border transition-all duration-200
                hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5
                ${selected ? 'border-2 border-primary shadow-sm' : 'border-border'}
                ${dayEvents.length > 0 ? 'font-semibold' : ''}
                relative group
              `}
            >
              <div className={`text-sm ${today ? 'text-primary font-bold' : ''}`}>
                {today ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {day}
                  </span>
                ) : day}
              </div>
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${getEventTypeColor(event.type)}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{dayEvents.length - 3}</div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}