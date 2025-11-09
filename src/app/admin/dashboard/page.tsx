"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import StatusBadge from '@/components/common/StatusBadge'
import AnnouncementModal from '@/components/admin/AnnouncementModal'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Announcement } from '@/interface/data'

function StatCard({ label, value, color }: { label: string; value: number | string; color: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' }) {
  return (
      <div className={`p-4 rounded-xl shadow w-60`}> 
        <div className={`stat-title text-xs font-semibold`}>{label}</div>
        <div className={`stat-value text-xl font-extrabold text-${color}`}>{value}</div>
      </div>
  )
}

function MonthCalendar({ date, onDayClick }: { date: Date; onDayClick: (day: number, fullDate: Date) => void }) {
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
    const dayDate = new Date(year, month, day)
    const dateString = dayDate.toISOString().split('T')[0] // YYYY-MM-DD format
    
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

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg text-secondary font-bold">{monthLabel}</div>
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

export default function AdminDashboardPage() {
  const stats = useAdminDashboard()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([])

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
    const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD format
    return allAnnouncements.filter(announcement => announcement.date === dateString)
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
      {/* Top stats */}
      <div className="flex flex-wrap flex-row gap-4 mb-6">
        <StatCard label="Total of Population" value={stats.totalPopulation} color="secondary" />
        <StatCard label="Normal Residents" value={stats.normalResidents} color="success" />
        <StatCard label="Pregnants" value={stats.pregnantResidents} color="accent" />
        <StatCard label="PWD's" value={stats.pwdResidents} color="info" />
        <StatCard label="Seniors" value={stats.seniorResidents} color="error" />
        <StatCard label="Childs" value={stats.childResidents} color="success" />
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
                <div className="font-bold text-xs text-zinc-500">Reports Submitted</div>
                <div className="ml-auto text-xl font-bold text-secondary">{stats.reportsSubmitted}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <MonthCalendar date={new Date()} onDayClick={handleDayClick} />
        </div>
      </div>

      {/* Residents list */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="text-lg text-secondary font-bold mb-4">List of Residents</div>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Age</th>
                  <th>Name</th>
                  <th>H/W</th>
                  <th>Gender</th>
                  <th>Birth Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentResidents.map((r) => {
                  const birth = r.birthDate instanceof Date ? r.birthDate : undefined
                  const age = birth ? Math.max(0, new Date(Date.now() - birth.getTime()).getUTCFullYear() - 1970) : ''
                  return (
                    <tr key={r.id} className="text-xs font-medium text-zinc-500">
                      <td>{age}</td>
                      <td>{r.fullName ?? ''}</td>
                      <td>{r.height && r.weight ? `${r.height} cm / ${r.weight} kg` : '—'}</td>
                      <td className="capitalize">{r.gender}</td>
                      <td>{birth ? birth.toLocaleDateString() : ''}</td>
                      <td><StatusBadge status={r.status} size="xs" /></td>
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
