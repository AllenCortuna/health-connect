import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { Resident } from '@/interface/user'

interface RecentMessage {
  id: string
  message: string
  senderName: string
  createdAt: Date
  status: 'read' | 'unread'
}

interface UpcomingAnnouncement {
  id: string
  title: string
  date: string
  time: string
  important: boolean
}

interface HealthInfo {
  bmi?: number
  bmiCategory?: string
  age?: number
  healthStatus?: string
}

export function useResidentDashboard() {
  const { account } = useAccountStore()
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [upcomingAnnouncements, setUpcomingAnnouncements] = useState<UpcomingAnnouncement[]>([])
  const [residentData, setResidentData] = useState<Resident | null>(null)
  const [healthInfo, setHealthInfo] = useState<HealthInfo>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!account?.id) {
      setIsLoading(false)
      return
    }

    fetchDashboardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        fetchRecentMessages(),
        fetchUpcomingAnnouncements(),
        fetchResidentData(),
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentMessages = async () => {
    try {
      const messagesRef = collection(db, 'messages')
      const q = query(
        messagesRef,
        where('receiverId', '==', account?.id),
        orderBy('createdAt', 'desc'),
        limit(3)
      )
      
      const querySnapshot = await getDocs(q)
      const messages: RecentMessage[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        messages.push({
          id: doc.id,
          message: data.message,
          senderName: data.senderName,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          status: data.status
        })
      })
      
      setRecentMessages(messages)
    } catch (error) {
      console.error('Error fetching recent messages:', error)
    }
  }

  const fetchUpcomingAnnouncements = async () => {
    try {
      const announcementsRef = collection(db, 'announcements')
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      
      const q = query(
        announcementsRef,
        where('date', '>=', todayString),
        orderBy('date', 'asc'),
        limit(3)
      )
      
      const querySnapshot = await getDocs(q)
      const announcements: UpcomingAnnouncement[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        announcements.push({
          id: doc.id,
          title: data.title,
          date: data.date,
          time: data.time,
          important: data.important
        })
      })
      
      setUpcomingAnnouncements(announcements)
    } catch (error) {
      console.error('Error fetching upcoming announcements:', error)
    }
  }

  const fetchResidentData = async () => {
    try {
      const residentsRef = collection(db, 'residents')
      const q = query(residentsRef, where('email', '==', account?.email))
      
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const residentDoc = querySnapshot.docs[0]
        const residentData = {
          id: residentDoc.id,
          ...residentDoc.data(),
          birthDate: residentDoc.data().birthDate?.toDate?.() || new Date(residentDoc.data().birthDate),
          createdAt: residentDoc.data().createdAt?.toDate?.() || new Date(residentDoc.data().createdAt)
        } as Resident
        
        setResidentData(residentData)
        calculateHealthInfo(residentData)
      }
    } catch (error) {
      console.error('Error fetching resident data:', error)
    }
  }

  const calculateHealthInfo = (resident: Resident) => {
    if (resident.height && resident.weight) {
      const heightInMeters = resident.height / 100
      const bmi = resident.weight / (heightInMeters * heightInMeters)
      
      let bmiCategory = ''
      if (bmi < 18.5) bmiCategory = 'Underweight'
      else if (bmi < 25) bmiCategory = 'Normal'
      else if (bmi < 30) bmiCategory = 'Overweight'
      else bmiCategory = 'Obese'

      const age = new Date().getFullYear() - new Date(resident.birthDate).getFullYear()
      
      let healthStatus = 'Good'
      if (resident.status === 'pwd') healthStatus = 'Special Care'
      else if (resident.status === 'pregnant') healthStatus = 'Prenatal Care'
      else if (resident.status === 'senior') healthStatus = 'Senior Care'
      else if (bmi < 18.5 || bmi >= 30) healthStatus = 'Monitor'

      setHealthInfo({
        bmi: Math.round(bmi * 10) / 10,
        bmiCategory,
        age,
        healthStatus
      })
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const formatAnnouncementDate = (dateString: string, timeString: string) => {
    try {
      const date = new Date(`${dateString}T${timeString}`)
      const now = new Date()
      const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffInDays === 0) return 'Today'
      if (diffInDays === 1) return 'Tomorrow'
      if (diffInDays < 7) return `In ${diffInDays} days`
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return 'Invalid Date'
    }
  }

  return {
    recentMessages,
    upcomingAnnouncements,
    residentData,
    healthInfo,
    isLoading,
    formatDate,
    formatAnnouncementDate,
    refetch: fetchDashboardData
  }
}
