'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAccountStore } from '@/store/accountStore'
import { useResidentDashboard } from '@/hooks/useResidentDashboard'
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Announcement } from '@/interface/data'
import AnnouncementModal from '@/components/admin/AnnouncementModal'
import { 
  HiBell, 
  HiUser, 
  HiHeart,
} from 'react-icons/hi'
import { HiChatBubbleBottomCenterText } from 'react-icons/hi2'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'

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

const Dashboard = () => {
  const { account } = useAccountStore()
  const router = useRouter()
  const {
    recentMessages,
    upcomingAnnouncements,
    residentData,
    healthInfo,
    isLoading,
    formatDate,
  } = useResidentDashboard()
  
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
    const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD format
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  const getBMIStatusColor = (bmi?: number) => {
    if (!bmi) return 'text-gray-500'
    if (bmi < 18.5) return 'text-blue-600'
    if (bmi < 25) return 'text-green-600'
    if (bmi < 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthStatusColor = (status?: string) => {
    switch (status) {
      case 'Good': return 'text-green-600'
      case 'Monitor': return 'text-yellow-600'
      case 'Special Care': return 'text-blue-600'
      case 'Prenatal Care': return 'text-pink-600'
      case 'Senior Care': return 'text-purple-600'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {account?.name || residentData?.fullName || 'Resident'}!
        </p>
        {residentData && (
          <div className="mt-2 text-sm text-gray-500">
            Family Number: {residentData.familyNo} • {residentData.status.charAt(0).toUpperCase() + residentData.status.slice(1)}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat bg-primary text-primary-content rounded-lg">
          <div className="stat-figure text-primary-content">
            <HiChatBubbleBottomCenterText className="w-8 h-8" />
          </div>
          <div className="stat-title text-primary-content">Messages</div>
          <div className="stat-value text-primary-content">{recentMessages.length}</div>
          <div className="stat-desc text-primary-content">Recent Messages</div>
        </div>

        <div className="stat bg-secondary text-secondary-content rounded-lg">
          <div className="stat-figure text-secondary-content">
            <HiBell className="w-8 h-8" />
          </div>
          <div className="stat-title text-secondary-content">Announcements</div>
          <div className="stat-value text-secondary-content">{upcomingAnnouncements.length}</div>
          <div className="stat-desc text-secondary-content">Upcoming events</div>
        </div>

        <div className="stat bg-accent text-accent-content rounded-lg">
          <div className="stat-figure text-accent-content">
            <HiHeart className="w-8 h-8" />
          </div>
          <div className="stat-title text-accent-content">Health Status</div>
          <div className="stat-value text-accent-content text-lg">
            {healthInfo.healthStatus || 'N/A'}
          </div>
          <div className="stat-desc text-accent-content">Current status</div>
        </div>

        <div className="stat bg-neutral text-neutral-content rounded-lg">
          <div className="stat-figure text-neutral-content">
            <HiUser className="w-8 h-8" />
          </div>
          <div className="stat-title text-neutral-content">Age</div>
          <div className="stat-value text-neutral-content">{healthInfo.age || 'N/A'}</div>
          <div className="stat-desc text-neutral-content">Years old</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-lg font-bold text-secondary">
                <HiChatBubbleBottomCenterText className="w-8 h-8" />
                Recent Messages
              </h2>
            </div>
            
            {recentMessages.length === 0 ? (
              <div className="text-center py-8">
                <HiChatBubbleBottomCenterText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No recent messages</p>
                <button 
                  onClick={() => router.push('/resident/message/create')}
                  className="btn btn-primary btn-sm mt-2"
                >
                  Send First Message
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMessages.map((message) => (
                  <div 
                    key={message.id}
                    className="p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
                    onClick={() => router.push('/resident/message')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {message.senderName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {message.message}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {message.status === 'unread' && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
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

      {/* Health Information */}
      {residentData && (
        <div className="mt-6">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-lg text-secondary mb-4">
                <HiHeart className="w-5 h-5" />
                Health Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Personal Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700">Personal Details</h3>
                  <div className="text-xs space-y-1">
                    <div><span className="font-medium">Gender:</span> {residentData.gender}</div>
                    <div><span className="font-medium">Birth Date:</span> {new Date(residentData.birthDate).toLocaleDateString()}</div>
                    <div><span className="font-medium">Birth Place:</span> {residentData.birthPlace}</div>
                    <div><span className="font-medium">Address:</span> {residentData.address}</div>
                  </div>
                </div>

                {/* Health Metrics */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700">Health Metrics</h3>
                  <div className="text-xs space-y-1">
                    <div><span className="font-medium">Height:</span> {residentData.height ? `${residentData.height} cm` : 'N/A'}</div>
                    <div><span className="font-medium">Weight:</span> {residentData.weight ? `${residentData.weight} kg` : 'N/A'}</div>
                    <div><span className="font-medium">Blood Type:</span> {residentData.bloodType || 'N/A'}</div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">BMI:</span>
                      <span className={getBMIStatusColor(healthInfo.bmi)}>
                        {healthInfo.bmi || 'N/A'}
                      </span>
                      {healthInfo.bmiCategory && (
                        <span className="text-xs text-gray-500">({healthInfo.bmiCategory})</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Health Status */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700">Health Status</h3>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Status:</span>
                      <span className={getHealthStatusColor(healthInfo.healthStatus)}>
                        {healthInfo.healthStatus || 'N/A'}
                      </span>
                    </div>
                    <div><span className="font-medium">Category:</span> {residentData.status}</div>
                    {residentData.spouseName && (
                      <div><span className="font-medium">Spouse:</span> {residentData.spouseName}</div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700">Contact Information</h3>
                  <div className="text-xs space-y-1">
                    <div><span className="font-medium">Phone:</span> {residentData.contactNumber || 'N/A'}</div>
                    <div><span className="font-medium">Email:</span> {residentData.email || 'N/A'}</div>
                    <div><span className="font-medium">House No:</span> {residentData.houseNo || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Health Recommendations */}
              {healthInfo.bmi && (
                <div className="mt-4 p-3 bg-base-200 rounded-lg">
                  <h4 className="font-semibold text-sm text-secondary mb-2">Health Recommendations</h4>
                  <div className="text-xs text-gray-600">
                    {healthInfo.bmi < 18.5 && (
                      <p>Consider consulting with a healthcare provider about healthy weight gain strategies.</p>
                    )}
                    {healthInfo.bmi >= 18.5 && healthInfo.bmi < 25 && (
                      <p>Great! You&apos;re maintaining a healthy weight. Keep up the good work!</p>
                    )}
                    {healthInfo.bmi >= 25 && healthInfo.bmi < 30 && (
                      <p>Consider incorporating more physical activity and a balanced diet to maintain optimal health.</p>
                    )}
                    {healthInfo.bmi >= 30 && (
                      <p>It&apos;s recommended to consult with a healthcare provider about a personalized health plan.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

export default Dashboard
