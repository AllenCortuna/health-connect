'use client'

import { useEffect, useMemo, useState } from 'react'
import { collection, getCountFromServer, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Resident } from '@/interface/user'

export interface AdminDashboardStats {
  totalPopulation: number
  adultResidents: number
  seniorResidents: number
  childResidents: number
  newbornResidents: number
  infantResidents: number
  toddlerResidents: number
  patientsServed: number
  upcomingEvents: number
  reportsSubmitted: number
  recentResidents: Resident[]
  isLoading: boolean
  hasError: boolean
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

// Helper function to get age category
function getAgeCategory(birthDate: Date | undefined): string | null {
  if (!birthDate || !(birthDate instanceof Date)) return null
  
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

        // Get total population count
        const totalPopulationSnap = await getCountFromServer(residentCol)
        const totalPopulation = totalPopulationSnap.data().count

        // Fetch all residents to calculate age-based categories
        const allResidentsSnap = await getDocs(residentCol)
        let newbornResidents = 0
        let infantResidents = 0
        let toddlerResidents = 0
        let childResidents = 0
        let adultResidents = 0
        let seniorResidents = 0

        allResidentsSnap.forEach(doc => {
          const data = doc.data() as Resident & { birthDate?: FirestoreDateLike }
          const birthDate = normalizeToDate(data.birthDate)
          const ageCategory = getAgeCategory(birthDate)
          
          if (ageCategory === 'newborn') {
            newbornResidents++
          } else if (ageCategory === 'infant') {
            infantResidents++
          } else if (ageCategory === 'toddler') {
            toddlerResidents++
          } else if (ageCategory === 'child') {
            childResidents++
          } else if (ageCategory === 'adult') {
            adultResidents++
          } else if (ageCategory === 'senior') {
            seniorResidents++
          }
        })


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
          adultResidents,
          seniorResidents,
          childResidents,
          newbornResidents,
          infantResidents,
          toddlerResidents,
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
          adultResidents: 0,
          seniorResidents: 0,
          childResidents: 0,
          newbornResidents: 0,
          infantResidents: 0,
          toddlerResidents: 0,
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
    adultResidents: state?.adultResidents ?? 0,
    seniorResidents: state?.seniorResidents ?? 0,
    childResidents: state?.childResidents ?? 0,
    newbornResidents: state?.newbornResidents ?? 0,
    infantResidents: state?.infantResidents ?? 0,
    toddlerResidents: state?.toddlerResidents ?? 0,
    patientsServed: state?.patientsServed ?? 0,
    upcomingEvents: state?.upcomingEvents ?? 0,
    reportsSubmitted: state?.reportsSubmitted ?? 0,
    recentResidents: state?.recentResidents ?? [],
    isLoading,
    hasError
  }), [state, isLoading, hasError])
}

export { useAdminDashboard }


