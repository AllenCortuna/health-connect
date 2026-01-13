"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import StatusBadge from '@/components/common/StatusBadge'
import AnnouncementModal from '@/components/admin/AnnouncementModal'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Announcement } from '@/interface/data'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { useAccountStore } from '@/store/accountStore'

function StatCard({ label, value, color }: { label: string; value: number | string; color: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' }) {
  return (
      <div className={`p-4 rounded-xl shadow w-60`}> 
        <div className={`stat-title text-xs font-semibold`}>{label}</div>
        <div className={`stat-value text-xl font-extrabold text-${color}`}>{value}</div>
      </div>
  )
}

function MonthCalendar({ 
  date, 
  onDayClick, 
  onPreviousMonth, 
  onNextMonth, 
  onToday 
}: { 
  date: Date
  onDayClick: (day: number, fullDate: Date) => void
  onPreviousMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  const { monthLabel, weeks, today } = useMemo(() => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const monthLabelLocal = date.toLocaleString(undefined, { month: 'long', year: 'numeric' })
    const days: (number | null)[] = []
    const startWeekday = firstDay.getDay() // 0-6
    for (let i = 0; i < startWeekday; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
    while (days.length % 7 !== 0) days.push(null)
    const weeksLocal: (number | null)[][] = []
    for (let i = 0; i < days.length; i += 7) weeksLocal.push(days.slice(i, i + 7))
    const todayLocal = new Date()
    return { monthLabel: monthLabelLocal, weeks: weeksLocal, today: todayLocal }
  }, [date])

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const announcementsRef = collection(db, 'announcements')
        const q = query(announcementsRef, orderBy('date', 'asc'))
        const querySnapshot = await getDocs(q)
        
        const announcementsData: Announcement[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const announcement = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
          } as Announcement
          
          announcementsData.push(announcement)
        })
        
        setAnnouncements(announcementsData)
      } catch (error) {
        console.error('Error fetching announcements:', error)
      }
    }

    fetchAnnouncements()
  }, [date])

  const getAnnouncementCount = (day: number | null): number => {
    if (!day) return 0
    const year = date.getFullYear()
    const month = date.getMonth()
    // Use local date formatting to avoid timezone issues
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` // YYYY-MM-DD format
    
    return announcements.filter(announcement => announcement.date === dateString).length
  }

  const isToday = (day: number | null) => {
    if (!day) return false
    return (
      today.getDate() === day &&
      today.getMonth() === date.getMonth() &&
      today.getFullYear() === date.getFullYear()
    )
  }

  const handleDayClick = (day: number | null) => {
    if (!day) return
    const year = date.getFullYear()
    const month = date.getMonth()
    const fullDate = new Date(year, month, day)
    onDayClick(day, fullDate)
  }

  const isCurrentMonth = useMemo(() => {
    const today = new Date()
    return today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()
  }, [date])

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onPreviousMonth}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Previous month"
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="text-lg text-secondary font-bold">{monthLabel}</div>
            {!isCurrentMonth && (
              <button
                onClick={onToday}
                className="btn btn-ghost btn-xs"
                aria-label="Go to today"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={onNextMonth}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Next month"
          >
            <HiChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold opacity-70 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weeks.flat().map((d, idx) => {
            const count = getAnnouncementCount(d)
            const isTodayDay = isToday(d)
            
            return (
              <div
                key={idx}
                onClick={() => handleDayClick(d)}
                className={`h-10 flex flex-col items-center justify-center rounded-md relative cursor-pointer transition-all hover:opacity-80 ${
                  d 
                    ? isTodayDay
                      ? 'bg-green-500 text-white font-bold' 
                      : 'bg-base-200' 
                    : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <span>{d ?? ''}</span>
                {count > 0 && (
                  <span className={`absolute top-0 right-0 text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center bg-red-500 text-white`}>
                    {count}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate age in months
function getAgeInMonths(birthDate: Date): number {
  const today = new Date()
  const years = today.getFullYear() - birthDate.getFullYear()
  const months = today.getMonth() - birthDate.getMonth()
  const days = today.getDate() - birthDate.getDate()
  
  let totalMonths = years * 12 + months
  if (days < 0) totalMonths--
  
  return Math.max(0, totalMonths)
}

// Helper function to get age-based status
function getAgeBasedStatus(birthDate: Date | undefined, originalStatus: string): string {
  if (!birthDate || !(birthDate instanceof Date)) return originalStatus
  
  // Don't override pwd or pregnant status
  if (originalStatus === 'pwd' || originalStatus === 'pregnant') {
    return originalStatus
  }
  
  const months = getAgeInMonths(birthDate)
  const years = Math.floor(months / 12)
  
  if (months < 2) {
    return 'newborn'
  } else if (months < 12) {
    return 'infant'
  } else if (years < 4) {
    return 'toddler'
  } else if (years < 18) {
    return 'child'
  } else if (years < 65) {
    return 'adult'
  } else {
    return 'senior'
  }
}

// Helper function to calculate age display
function getAgeDisplay(birthDate: Date | undefined): string {
  if (!birthDate || !(birthDate instanceof Date)) return ''
  
  const months = getAgeInMonths(birthDate)
  const years = Math.floor(months / 12)
  
  if (months < 12) {
    return `${months} mo`
  } else if (years < 4) {
    return `${years} yr`
  } else {
    return `${years} yr`
  }
}

export default function AdminDashboardPage() {
  const { account } = useAccountStore()
  const stats = useAdminDashboard()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  useEffect(() => {
    const fetchAllAnnouncements = async () => {
      try {
        const announcementsRef = collection(db, 'announcements')
        const q = query(announcementsRef, orderBy('date', 'asc'))
        const querySnapshot = await getDocs(q)
        
        const announcementsData: Announcement[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const announcement = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
          } as Announcement
          
          announcementsData.push(announcement)
        })
        
        setAllAnnouncements(announcementsData)
      } catch (error) {
        console.error('Error fetching announcements:', error)
      }
    }

    fetchAllAnnouncements()
  }, [])

  const handleDayClick = (day: number, fullDate: Date) => {
    setSelectedDate(fullDate)
    setIsModalOpen(true)
  }

  const getAnnouncementsForDate = (date: Date | null): Announcement[] => {
    if (!date) return []
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` // YYYY-MM-DD format
    return allAnnouncements.filter(announcement => announcement.date === dateString)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  if (stats.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>
        <p className="text-gray-600"> Welcome back, {account?.name || 'Admin'}</p>
      </div>
      {/* Top stats */}
      <div className="flex flex-wrap flex-row gap-4 mb-6">
        <StatCard label="Total of Population" value={stats.totalPopulation} color="secondary" />
        <StatCard label="Newborn/s" value={stats.newbornResidents} color="accent" />
        <StatCard label="Infant/s" value={stats.infantResidents} color="info" />
        <StatCard label="Toddler/s" value={stats.toddlerResidents} color="primary" />
        <StatCard label="Child/s" value={stats.childResidents} color="success" />
        <StatCard label="Adult/s" value={stats.normalResidents} color="success" />
        <StatCard label="Senior/s" value={stats.seniorResidents} color="error" />
      </div>

      {/* Quick status + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="text-lg text-secondary font-bold mb-4">Quick Status</div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="font-bold text-xs text-zinc-500">Patients Served</div>
                <div className="ml-auto text-xl font-bold text-secondary">{stats.patientsServed}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="font-bold text-xs text-zinc-500">Upcoming Events</div>
                <div className="ml-auto text-xl font-bold text-secondary">{stats.upcomingEvents}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="font-bold text-xs text-zinc-500">Report/s Submitted</div>
                <div className="ml-auto text-xl font-bold text-secondary">{stats.reportsSubmitted}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <MonthCalendar 
            date={currentMonth} 
            onDayClick={handleDayClick}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
            onToday={goToToday}
          />
        </div>
      </div>

      {/* Residents list */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="text-lg text-secondary font-bold mb-4">List of Residents</div>
          
          {/* Mobile: Card layout */}
          <div className="md:hidden space-y-3">
            {stats.recentResidents.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-6">No residents found</div>
            ) : (
              stats.recentResidents.map((r) => {
                const birth = r.birthDate instanceof Date ? r.birthDate : undefined
                const ageDisplay = getAgeDisplay(birth)
                const displayStatus = getAgeBasedStatus(birth, r.status)
                return (
                  <div key={r.id} className="bg-base-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-zinc-700">{r.fullName ?? ''}</div>
                      <StatusBadge status={displayStatus} size="xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
                      <div>
                        <span className="font-medium">Age: </span>
                        {ageDisplay}
                      </div>
                      <div>
                        <span className="font-medium">Gender: </span>
                        <span className="capitalize">{r.gender}</span>
                      </div>
                      <div>
                        <span className="font-medium">Height/Weight: </span>
                        {r.height && r.weight ? `${r.height} cm / ${r.weight} kg` : '—'}
                      </div>
                      <div>
                        <span className="font-medium">DOB: </span>
                        {birth ? birth.toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Age</th>
                  <th>Name</th>
                  <th>Height/Weight</th>
                  <th>Gender</th>
                  <th>Date of Birth</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentResidents.map((r) => {
                  const birth = r.birthDate instanceof Date ? r.birthDate : undefined
                  const ageDisplay = getAgeDisplay(birth)
                  const displayStatus = getAgeBasedStatus(birth, r.status)
                  return (
                    <tr key={r.id} className="text-xs font-medium text-zinc-500">
                      <td>{ageDisplay}</td>
                      <td>{r.fullName ?? ''}</td>
                      <td>{r.height && r.weight ? `${r.height} cm / ${r.weight} kg` : '—'}</td>
                      <td className="capitalize">{r.gender}</td>
                      <td>{birth ? birth.toLocaleDateString() : ''}</td>
                      <td><StatusBadge status={displayStatus} size="xs" /></td>
                    </tr>
                  )
                })}
                {stats.recentResidents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-sm text-gray-500 py-6">No residents found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDate(null)
        }}
        date={selectedDate}
        announcements={getAnnouncementsForDate(selectedDate)}
      />
    </div>
  )
}
