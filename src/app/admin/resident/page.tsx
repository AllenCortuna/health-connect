'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Resident } from '@/interface/user'
import { useRouter } from 'next/navigation'
import { FaPlus } from 'react-icons/fa'
import ViewResidentModal from '@/components/bhw/ViewResidentModal'
import StatusBadge from '@/components/common/StatusBadge'

const Resident = () => {
  const router = useRouter()
  const [residents, setResidents] = useState<Resident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchResidents()
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
    
    const matchesStatus = statusFilter === 'all' || resident.status === statusFilter
    
    return matchesSearch && matchesStatus
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Statuses</option>
                <option value="child">Child</option>
                <option value="adult">Adult</option>
                <option value="senior">Senior</option>
                <option value="pwd">PWD</option>
                <option value="pregnant">Pregnant</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Results</span>
              </label>
              <div className="input input-bordered input-sm bg-base-200 flex items-center">
                <span className="text-sm">
                  {filteredResidents.length} of {residents.length} residents
                </span>
              </div>
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
                      setStatusFilter('all')
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
                    <th>Status</th>
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
                        <StatusBadge status={resident.status} size="xs" />
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