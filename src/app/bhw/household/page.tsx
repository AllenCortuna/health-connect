'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, getDocs, query, doc, where, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Household } from '@/interface/user'
import { useRouter } from 'next/navigation'
import { FaPlus, FaTrash, FaUsers, FaEdit } from 'react-icons/fa'
import Link from 'next/link'
import { successToast, errorToast } from '@/lib/toast'

// Helper function to extract numeric part from household number (e.g., "BRGY7-16" -> 16)
const getNumericPart = (householdNumber: string): number | null => {
  // Try to extract number after the last hyphen
  const parts = householdNumber.split('-')
  if (parts.length > 1) {
    const numPart = parts[parts.length - 1]
    const num = parseInt(numPart, 10)
    if (!isNaN(num)) {
      return num
    }
  }
  
  // Try to parse the entire string as a number
  const num = parseInt(householdNumber, 10)
  if (!isNaN(num)) {
    return num
  }
  
  return null
}

// Helper function to sort households by household number
const sortHouseholds = (a: Household, b: Household): number => {
  const numA = getNumericPart(a.householdNumber)
  const numB = getNumericPart(b.householdNumber)
  
  // If both have numeric parts, sort numerically
  if (numA !== null && numB !== null) {
    return numA - numB
  }
  
  // If only one has a numeric part, prioritize it
  if (numA !== null) return -1
  if (numB !== null) return 1
  
  // Otherwise, sort alphabetically
  return a.householdNumber.localeCompare(b.householdNumber)
}

const Household = () => {
  const router = useRouter()
  const [households, setHouseholds] = useState<Household[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [householdToDelete, setHouseholdToDelete] = useState<Household | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingResidentsCount, setDeletingResidentsCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchHouseholds = useCallback(async () => {
    try {
      setIsLoading(true)
      const householdsRef = collection(db, 'household')
      const querySnapshot = await getDocs(householdsRef)
      
      const householdsData: Household[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        householdsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        } as Household)
      })
      
      // Sort by household number in the frontend
      householdsData.sort(sortHouseholds)
      
      setHouseholds(householdsData)
    } catch (error) {
      console.error('Error fetching households:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHouseholds()
  }, [fetchHouseholds])

  // Refresh households when page becomes visible (returning from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchHouseholds()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchHouseholds])

  const openDeleteModal = (household: Household) => {
    setHouseholdToDelete(household)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setHouseholdToDelete(null)
    setDeletingResidentsCount(0)
  }

  const handleDeleteHousehold = async () => {
    if (!householdToDelete) return

    setIsDeleting(true)
    try {
      // Create a batch to delete household and all related residents
      const batch = writeBatch(db)
      
      // Delete the household
      const householdRef = doc(db, 'household', householdToDelete.id)
      batch.delete(householdRef)
      
      // Find and delete all residents in this household
      const residentsRef = collection(db, 'resident')
      const residentsQuery = query(residentsRef, where('householdId', '==', householdToDelete.householdNumber))
      const residentsSnapshot = await getDocs(residentsQuery)
      
      // Add all residents to the batch for deletion
      residentsSnapshot.forEach((residentDoc) => {
        batch.delete(residentDoc.ref)
      })
      
      // Show count of residents being deleted
      setDeletingResidentsCount(residentsSnapshot.size)
      
      // Commit the batch (deletes household and all residents in one transaction)
      await batch.commit()
      
      successToast(`Household and ${residentsSnapshot.size} residents deleted successfully!`)
      closeDeleteModal()
      fetchHouseholds() // Refresh the list
    } catch (error) {
      console.error('Error deleting household:', error)
      errorToast('Failed to delete household. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter and sort households
  const filteredHouseholds = useMemo(() => {
    const filtered = households.filter((household) => {
      const matchesSearch = searchTerm === '' || 
        household.householdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        household.headOfHousehold.toLowerCase().includes(searchTerm.toLowerCase()) ||
        household.address.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
    
    // Maintain sort order after filtering
    return [...filtered].sort(sortHouseholds)
  }, [households, searchTerm])

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
        <h1 className="text-2xl font-bold text-secondary">Households</h1>
        <button
          onClick={() => router.push('/bhw/household/add')}
          className="btn btn-secondary btn-sm"
        >
          <FaPlus className="mr-2" />
          Add Household
        </button>
      </div>

      {/* Search Section */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Search</span>
              </label>
              <input
                type="text"
                placeholder="Search by household number, head of household, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {filteredHouseholds.length === 0 ? (
            <div className="text-center py-8">
              {households.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-4">No households found</p>
                  <button
                    onClick={() => router.push('/bhw/household/add')}
                    className="btn btn-secondary"
                  >
                    <FaPlus className="mr-2" />
                    Add First Household
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">No households match your search criteria</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="btn btn-outline btn-secondary"
                  >
                    Clear Search
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Household Number</th>
                    <th>Head of Household</th>
                    <th>Address</th>
                    <th>Total Members</th>
                    <th>Contact Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHouseholds.map((household) => (
                    <tr key={household.id} className="hover text-xs font-medium text-zinc-500">
                      <td>
                        <div className="font-medium">
                          {household.householdNumber}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">
                          {household.headOfHousehold}
                        </div>
                      </td>
                      <td>
                        <div className="max-w-xs truncate">
                          {household.address}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <FaUsers className="text-primary" />
                          <span>{household.totalMembers}</span>
                        </div>
                      </td>
                      <td>
                        {household.headOfHouseholdContactNumber}
                      </td>
                      <td className="flex items-center gap-2">
                        <Link
                          href={`/bhw/household/edit-member?householdNumber=${household.householdNumber}`}
                          className="btn btn-outline btn-primary btn-xs"
                          title="Manage Members"
                        >
                          <FaUsers />
                        </Link>
                        <Link
                          href={`/bhw/household/edit?id=${household.id}`}
                          className="btn btn-outline btn-secondary btn-xs"
                          title="Edit Household"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(household)}
                          className="btn btn-outline btn-error btn-xs"
                          title="Delete Household"
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

      {/* Delete Household Modal */}
      {isDeleteModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Household</h3>
            <p className="py-4">
              Are you sure you want to delete household <strong>{householdToDelete?.householdNumber}</strong>? 
              <br /><br />
              <strong>This will also delete:</strong>
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>All residents in this household ({householdToDelete?.totalMembers} members)</li>
                <li>All family data associated with this household</li>
                <li>All health records and related information</li>
              </ul>
              <br />
              <strong className="text-error">This action cannot be undone!</strong>
            </p>
            <div className="modal-action">
              <button
                onClick={closeDeleteModal}
                className="btn btn-outline"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteHousehold}
                className="btn btn-error"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting household and {deletingResidentsCount} residents...
                  </>
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

export default Household
