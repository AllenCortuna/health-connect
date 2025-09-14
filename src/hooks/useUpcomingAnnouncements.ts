import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useUpcomingAnnouncements() {
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingAnnouncements()
  }, [])

  const fetchUpcomingAnnouncements = async () => {
    try {
      setIsLoading(true)
      const announcementsRef = collection(db, 'announcements')
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      
      // Query for announcements with date greater than today
      const q = query(
        announcementsRef, 
        where('date', '>=', todayString),
        orderBy('date', 'asc')
      )
      
      const querySnapshot = await getDocs(q)
      setUpcomingCount(querySnapshot.size)
    } catch (error) {
      console.error('Error fetching upcoming announcements:', error)
      setUpcomingCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  return { upcomingCount, isLoading, refetch: fetchUpcomingAnnouncements }
}
