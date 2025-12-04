'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Resident, Household } from '@/interface/user'
import { useRouter } from 'next/navigation'
import { FaPlus } from 'react-icons/fa'
import ViewResidentModal from '@/components/bhw/ViewResidentModal'

const Resident = () => {
  const router = useRouter()
  const [residents, setResidents] = useState<Resident[]>([])
  const [households, setHouseholds] = useState<Household[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [familyFilter, setFamilyFilter] = useState<string>('all')
  const [householdHeadFilter, setHouseholdHeadFilter] = useState<string>('all')

  useEffect(() => {
    fetchResidents()
    fetchHouseholds()
  }, [])

  const fetchResidents = async () => {
    try {
      setIsLoading(true)
      const residentsRef = collection(db, 'resident')
      const q = query(residentsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const residentsData: Resident[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        residentsData.push({
          id: doc.id,
          ...data,
          birthDate: data.birthDate?.toDate?.() || data.birthDate,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        } as Resident)
      })
      
      setResidents(residentsData)
    } catch (error) {
      console.error('Error fetching residents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHouseholds = async () => {
    try {
      const householdsRef = collection(db, 'household')
      const q = query(householdsRef, orderBy('headOfHousehold', 'asc'))
      const querySnapshot = await getDocs(q)
      
      const householdsData: Household[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        householdsData.push({
          id: doc.id,
          ...data
        } as Household)
      })
      
      setHouseholds(householdsData)
    } catch (error) {
      console.error('Error fetching households:', error)
    }
  }

  // Create a map of householdId to headOfHousehold name
  const householdHeadMap = useMemo(() => {
    const map = new Map<string, string>()
    households.forEach(household => {
      map.set(household.id, household.headOfHousehold)
      // Also map by householdNumber in case residents use that
      map.set(household.householdNumber, household.headOfHousehold)
    })
    return map
  }, [households])

  // Get unique family numbers and household head names for filters
  const uniqueFamilyNumbers = useMemo(() => {
    const familyNos = new Set<string>()
    residents.forEach(resident => {
      if (resident.familyNo) {
        familyNos.add(resident.familyNo)
      }
    })
    return Array.from(familyNos).sort()
  }, [residents])

  const uniqueHouseholdHeads = useMemo(() => {
    const heads = new Set<string>()
    households.forEach(household => {
      if (household.headOfHousehold) {
        heads.add(household.headOfHousehold)
      }
    })
    return Array.from(heads).sort()
  }, [households])

  const openModal = (resident: Resident) => {
    setSelectedResident(resident)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedResident(null)
  }

  // Filter and search residents
  const filteredResidents = residents.filter((resident) => {
    const matchesSearch = searchTerm === '' || 
      resident.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.familyNo.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFamily = familyFilter === 'all' || resident.familyNo === familyFilter
    
    // Get household head name for this resident
    const householdHeadName = resident.householdId 
      ? householdHeadMap.get(resident.householdId) || ''
      : ''
    const matchesHouseholdHead = householdHeadFilter === 'all' || 
      householdHeadName === householdHeadFilter
    
    return matchesSearch && matchesFamily && matchesHouseholdHead
  })



  if (isLoading) {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary">Residents</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Search</span>
              </label>
              <input
                type="text"
                placeholder="Search by name or ID number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Status</span>
              </label>
              <select
                className="select select-bordered select-sm"
              >
                <option value="all">All Household Heads</option>
                {uniqueHouseholdHeads.map(head => (
                  <option key={head} value={head}>{head}</option>
                ))}
              </select>
            </div>

            {/* Family Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Family</span>
              </label>
              <select
                value={familyFilter}
                onChange={(e) => setFamilyFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Families</option>
                {uniqueFamilyNumbers.map(familyNo => (
                  <option key={familyNo} value={familyNo}>{familyNo}</option>
                ))}
              </select>
            </div>

            {/* Household Head Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Household Head</span>
              </label>
              <select
                value={householdHeadFilter}
                onChange={(e) => setHouseholdHeadFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Household Heads</option>
                {uniqueHouseholdHeads.map(head => (
                  <option key={head} value={head}>{head}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {filteredResidents.length === 0 ? (
            <div className="text-center py-8">
              {residents.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-4">No residents found</p>
                  <button
                    onClick={() => router.push('/bhw/resident/add')}
                    className="btn btn-secondary"
                  >
                    <FaPlus className="mr-2" />
                    Add First Resident
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">No residents match your search criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setFamilyFilter('all')
                      setHouseholdHeadFilter('all')
                    }}
                    className="btn btn-outline btn-secondary"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Family Number</th>
                    <th>Gender</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map((resident) => (
                    <tr key={resident.id} className="hover text-xs font-medium text-zinc-500" >
                      <td>
                        <div className="font-medium">
                          {resident.fullName}
                        </div>
                      </td>
                      <td>
                          {resident.familyNo}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{resident.gender}</span>
                        </div>
                      </td>
                      <td className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(resident)}
                          className="btn btn-outline btn-secondary btn-xs"
                          title="View Details"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Resident Modal */}
      <ViewResidentModal
        resident={selectedResident}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

    </div>
  )
}

export default Resident