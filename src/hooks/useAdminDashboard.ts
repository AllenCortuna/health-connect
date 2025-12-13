'use client'

import { useEffect, useMemo, useState } from 'react'
import { collection, getCountFromServer, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Resident } from '@/interface/user'

export interface AdminDashboardStats {
  totalPopulation: number
  normalResidents: number
  pregnantResidents: number
  pwdResidents: number
  seniorResidents: number
  childResidents: number
  patientsServed: number
  upcomingEvents: number
  reportsSubmitted: number
  recentResidents: Resident[]
  isLoading: boolean
  hasError: boolean
}

function useAdminDashboard(): AdminDashboardStats {
  const [state, setState] = useState<Omit<AdminDashboardStats, 'isLoading' | 'hasError'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isActive = true

    type FirestoreDateLike = Date | Timestamp | string | null | undefined

    function normalizeToDate(value: FirestoreDateLike): Date | undefined {
      if (!value) return undefined
      if (value instanceof Date) return value
      if (value instanceof Timestamp) return value.toDate()
      if (typeof value === 'string') {
        const parsed = new Date(value)
        return isNaN(parsed.getTime()) ? undefined : parsed
      }
      return undefined
    }

    async function fetchStats() {
      setIsLoading(true)
      setHasError(false)
      try {
        // Collections
        const residentCol = collection(db, 'resident')
        const messageCol = collection(db, 'messages')
        const reportsCol = collection(db, 'reports')
        const eventsCol = collection(db, 'announcements')

        // Counts
        const [
          totalPopulationSnap,
          pregnantSnap,
          pwdSnap,
          seniorSnap,
          childSnap
        ] = await Promise.all([
          getCountFromServer(residentCol),
          getCountFromServer(query(residentCol, where('status', '==', 'pregnant'))),
          getCountFromServer(query(residentCol, where('status', '==', 'pwd'))),
          getCountFromServer(query(residentCol, where('status', '==', 'senior'))),
          getCountFromServer(query(residentCol, where('status', '==', 'child')))
        ])

        const totalPopulation = totalPopulationSnap.data().count
        const pregnantResidents = pregnantSnap.data().count
        const pwdResidents = pwdSnap.data().count
        const seniorResidents = seniorSnap.data().count
        const childResidents = childSnap.data().count

        // Derive normal residents (best-effort fallback if schema differs)
        const normalResidents = Math.max(
          0,
          totalPopulation - pregnantResidents - pwdResidents - seniorResidents - childResidents
        )

        // Patients served: derive from messages with keyword or a dedicated collection if available
        // Here we approximate using messages where messageType === 'consultation' if present
        let patientsServed = 0
        try {
          const consultSnap = await getCountFromServer(query(messageCol, where('messageType', '==', 'consultation')))
          patientsServed = consultSnap.data().count
        } catch {
          patientsServed = 0
        }

        // Upcoming events: announcements with date >= today (date is stored as YYYY-MM-DD string)
        let upcomingEvents = 0
        try {
          const today = new Date()
          const todayString = today.toISOString().split('T')[0] // YYYY-MM-DD format
          const eventsSnap = await getDocs(
            query(
              eventsCol,
              where('date', '>=', todayString),
              orderBy('date', 'asc')
            )
          )
          upcomingEvents = eventsSnap.size
        } catch {
          upcomingEvents = 0
        }

        // Reports submitted
        let reportsSubmitted = 0
        try {
          const reportsCount = await getCountFromServer(reportsCol)
          reportsSubmitted = reportsCount.data().count
        } catch {
          reportsSubmitted = 0
        }

        // Recent residents
        const recentSnap = await getDocs(query(residentCol, orderBy('createdAt', 'desc')))
        const recentResidents: Resident[] = recentSnap.docs.slice(0, 10).map(doc => {
          const data = doc.data() as Resident & { createdAt?: FirestoreDateLike; birthDate?: FirestoreDateLike }
          return {
            ...data,
            id: doc.id,
            createdAt: normalizeToDate(data.createdAt),
            birthDate: normalizeToDate(data.birthDate)
          } as Resident
        })

        if (!isActive) return
        setState({
          totalPopulation,
          normalResidents,
          pregnantResidents,
          pwdResidents,
          seniorResidents,
          childResidents,
          patientsServed,
          upcomingEvents,
          reportsSubmitted,
          recentResidents
        })
      } catch {
        if (!isActive) return
        setHasError(true)
        setState({
          totalPopulation: 0,
          normalResidents: 0,
          pregnantResidents: 0,
          pwdResidents: 0,
          seniorResidents: 0,
          childResidents: 0,
          patientsServed: 0,
          upcomingEvents: 0,
          reportsSubmitted: 0,
          recentResidents: []
        })
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    fetchStats()
    return () => { isActive = false }
  }, [])

  return useMemo(() => ({
    totalPopulation: state?.totalPopulation ?? 0,
    normalResidents: state?.normalResidents ?? 0,
    pregnantResidents: state?.pregnantResidents ?? 0,
    pwdResidents: state?.pwdResidents ?? 0,
    seniorResidents: state?.seniorResidents ?? 0,
    childResidents: state?.childResidents ?? 0,
    patientsServed: state?.patientsServed ?? 0,
    upcomingEvents: state?.upcomingEvents ?? 0,
    reportsSubmitted: state?.reportsSubmitted ?? 0,
    recentResidents: state?.recentResidents ?? [],
    isLoading,
    hasError
  }), [state, isLoading, hasError])
}

export { useAdminDashboard }


