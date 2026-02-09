'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  format,
  parseISO
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sessionStatusColors } from '@/lib/constants/display'

interface Session {
  id: string
  date: string
  duration_minutes: number
  status: string
  service_type: { name: string } | null
  contractor: { name: string } | null
  attendees: {
    client: { name: string } | null
  }[]
}

interface SessionsCalendarProps {
  sessions: Session[]
  isAdmin: boolean
}

export function SessionsCalendar({ sessions, isAdmin }: SessionsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Calendar navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const today = new Date()

  // Calendar grid generation
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  // Get sessions for a specific day
  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => isSameDay(parseISO(session.date), day))
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b bg-gray-50 dark:bg-gray-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 dark:bg-gray-800 gap-px">
          {calendarDays.map((day) => {
            const daySessions = getSessionsForDay(day)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isToday = isSameDay(day, today)

            return (
              <div
                key={day.toString()}
                className={`min-h-[120px] bg-white dark:bg-gray-900 p-2 ${
                  !isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/50 text-gray-400' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Session Chips */}
                <div className="mt-2 space-y-1">
                  {daySessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className="block"
                    >
                      <div className={`text-xs p-1.5 rounded border border-transparent hover:border-blue-300 transition-colors ${sessionStatusColors[session.status] || 'bg-gray-100'}`}>
                        <div className="font-semibold truncate">
                          {session.service_type?.name}
                        </div>
                        <div className="truncate opacity-75">
                          {session.attendees.map(a => a.client?.name).join(', ')}
                        </div>
                        {isAdmin && session.contractor && (
                          <div className="text-[10px] mt-0.5 opacity-60 truncate">
                            {session.contractor.name}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  
                  {/* Mobile-friendly indicator (dots) if too many items - purely visual for now, assumes vertical scrolling is okay on desktop */}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

