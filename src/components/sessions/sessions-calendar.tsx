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
import { Badge } from '@/components/ui/badge'
import { sessionStatusColors, sessionStatusLabels } from '@/lib/constants/display'

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
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

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

  const selectedDaySessions = selectedDay ? getSessionsForDay(selectedDay) : []

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

      {/* Desktop Calendar Grid */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
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
                      href={`/sessions/${session.id}/`}
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
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Calendar: compact grid + selected day detail */}
      <div className="md:hidden border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b bg-gray-50 dark:bg-gray-800">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Compact days grid */}
        <div className="grid grid-cols-7 bg-gray-200 dark:bg-gray-800 gap-px">
          {calendarDays.map((day) => {
            const daySessions = getSessionsForDay(day)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isToday = isSameDay(day, today)
            const isSelected = selectedDay && isSameDay(day, selectedDay)

            return (
              <button
                type="button"
                key={day.toString()}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`min-h-[52px] bg-white dark:bg-gray-900 p-1 flex flex-col items-center transition-colors ${
                  !isCurrentMonth ? 'opacity-40' : ''
                } ${isSelected ? 'bg-blue-50 dark:bg-blue-950/40' : ''}`}
              >
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-blue-600 text-white'
                      : isSelected
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {/* Session dots */}
                {daySessions.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {daySessions.length <= 4 ? (
                      daySessions.map((s) => (
                        <span
                          key={s.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.status === 'submitted' ? 'bg-amber-500'
                              : s.status === 'approved' ? 'bg-green-500'
                              : s.status === 'draft' ? 'bg-gray-400'
                              : s.status === 'cancelled' ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                        />
                      ))
                    ) : (
                      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                        {daySessions.length}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile: Selected day detail panel */}
      {selectedDay && (
        <div className="md:hidden space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {format(selectedDay, 'EEEE, MMMM d')}
            {selectedDaySessions.length > 0 && (
              <span className="font-normal text-gray-500"> · {selectedDaySessions.length} session{selectedDaySessions.length !== 1 ? 's' : ''}</span>
            )}
          </h3>
          {selectedDaySessions.length > 0 ? (
            selectedDaySessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}/`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">
                        {session.service_type?.name || 'Session'}
                      </span>
                      <Badge className={`shrink-0 text-[10px] px-1.5 py-0 ${sessionStatusColors[session.status]}`}>
                        {sessionStatusLabels[session.status] || session.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {session.attendees.map(a => a.client?.name).filter(Boolean).join(', ') || 'No client'}
                      {' · '}{session.duration_minutes} min
                      {isAdmin && session.contractor ? ` · ${session.contractor.name}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-2">No sessions</p>
          )}
        </div>
      )}
    </div>
  )
}
