'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { BHW } from '@/interface/user'
import { useRouter } from 'next/navigation'
import { FaPlus, FaTrash } from 'react-icons/fa'
import StatusBadge from '@/components/common/StatusBadge'
import Link from 'next/link'
import { successToast, errorToast } from '@/lib/toast'
import { format, isValid } from 'date-fns'

const AdminBHW = () => {
  const router = useRouter()
  const [bhws, setBhws] = useState<BHW[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bhwToDelete, setBhwToDelete] = useState<BHW | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [barangayFilter, setBarangayFilter] = useState<string>('all')

  // Helper function to safely format dates
  const formatDate = (date: unknown): string => {
    if (!date) return 'N/A'
    
    try {
      // If it's a Firestore Timestamp, convert it
      const jsDate = (date as { toDate?: () => Date })?.toDate?.() || date
      
      // Check if it's a valid date and is a Date object
      if (jsDate instanceof Date && isValid(jsDate)) {
        return format(jsDate, 'MM/dd/yyyy')
      }
      
      return 'N/A'
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'N/A'
    }
  }

  useEffect(() => {
    fetchBHWs()
  }, [])

  const fetchBHWs = async () => {
    try {
      setIsLoading(true)
      const bhwsRef = collection(db, 'accounts')
      const q = query(bhwsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const bhwsData: BHW[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.role === 'bhw') {
          bhwsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            birthDate: data.birthDate?.toDate?.() || data.birthDate
          } as BHW)
        }
      })
      
      setBhws(bhwsData)
    } catch (error) {
      console.error('Error fetching BHWs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openDeleteModal = (bhw: BHW) => {
    setBhwToDelete(bhw)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setBhwToDelete(null)
  }

  const handleDeleteBHW = async () => {
    if (!bhwToDelete) return

    setIsDeleting(true)
    try {
      const bhwRef = doc(db, 'accounts', bhwToDelete.id)
      await deleteDoc(bhwRef)
      
      successToast('BHW deleted successfully!')
      closeDeleteModal()
      fetchBHWs() // Refresh the list
    } catch (error) {
      console.error('Error deleting BHW:', error)
      errorToast('Failed to delete BHW. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Get unique barangays from BHWs
  const uniqueBarangays = useMemo(() => {
    const barangays = new Set<string>()
    bhws.forEach(bhw => {
      if (bhw.barangay) {
        barangays.add(bhw.barangay)
      }
    })
    return Array.from(barangays).sort()
  }, [bhws])

  // Filter and search BHWs
  const filteredBHWs = bhws.filter((bhw) => {
    const matchesSearch = searchTerm === '' || 
      (bhw.name && bhw.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bhw.email && bhw.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || bhw.status === statusFilter
    const matchesGender = genderFilter === 'all' || bhw.gender === genderFilter
    const matchesBarangay = barangayFilter === 'all' || bhw.barangay === barangayFilter
    
    return matchesSearch && matchesStatus && matchesGender && matchesBarangay
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
        <h1 className="text-2xl font-bold text-secondary">Barangay Health Workers</h1>
        <button
          onClick={() => router.push('/admin/bhw/add')}
          className="btn btn-secondary btn-sm"
        >
          <FaPlus className="mr-2" />
          Add BHW
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Search</span>
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
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
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="separated">Separated</option>
                <option value="divorced">Divorced</option>
              </select>
            </div>

            {/* Gender Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Gender</span>
              </label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Barangay Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Barangay</span>
              </label>
              <select
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Barangays</option>
                {uniqueBarangays.map(barangay => (
                  <option key={barangay} value={barangay}>{barangay}</option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Results</span>
              </label>
              <div className="input input-bordered input-sm bg-base-200 flex items-center">
                <span className="text-sm">
                  {filteredBHWs.length} of {bhws.length} BHWs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {filteredBHWs.length === 0 ? (
            <div className="text-center py-8">
              {bhws.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-4">No BHWs found</p>
                  <button
                    onClick={() => router.push('/admin/bhw/add')}
                    className="btn btn-secondary"
                  >
                    <FaPlus className="mr-2" />
                    Add First BHW
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">No BHWs match your search criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setGenderFilter('all')
                      setBarangayFilter('all')
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
                    <th>Email</th>
                    <th>Status</th>
                    <th>Gender</th>
                    <th>Birth Date</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBHWs.map((bhw) => (
                    <tr key={bhw.id} className="hover text-xs font-medium text-zinc-500" >
                      <td>
                        <div className="font-medium">
                          {bhw.name || 'N/A'}
                        </div>
                      </td>
                      <td>
                        {bhw.email || 'N/A'}
                      </td>
                      <td>
                        <StatusBadge status={bhw.status} size="xs" />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{bhw.gender}</span>
                        </div>
                      </td>
                      <td>
                        {formatDate(bhw.birthDate)}
                      </td>
                      <td>
                        {bhw.contactNumber || 'N/A'}
                      </td>
                      <td className="flex items-center gap-2">
                        <Link
                          href={`/admin/bhw/edit?id=${bhw.id}`}
                          className="btn btn-outline btn-secondary btn-xs"
                          title="Edit BHW"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => openDeleteModal(bhw)}
                          className="btn btn-outline btn-error btn-xs"
                          title="Delete BHW"
                        >
                          <FaTrash />
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

      {/* Delete BHW Modal */}
      {isDeleteModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">Delete BHW</h3>
            <p className="py-4">
              Are you sure you want to delete <strong>{bhwToDelete?.name || 'this BHW'}</strong>? 
              This action cannot be undone.
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-outline" 
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error" 
                onClick={handleDeleteBHW}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBHW