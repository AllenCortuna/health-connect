'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useAccountStore } from '@/store/accountStore'
import { FaArrowLeft } from 'react-icons/fa'
import type { BHW } from '@/interface/user'

interface MedicineReleased {
  id: string
  medicineId: string
  medicineCode: string
  medicineName: string
  amount: number
  releaseDate: Date
  remarks: string
  previousQuantity: number
  newQuantity: number
  createdAt: Date
  barangay: string
}

export default function ReleasedMedicinesPage() {
  const router = useRouter()
  const { account } = useAccountStore()
  const bhwAccount = account?.role === 'bhw' ? (account as unknown as BHW) : undefined
  const [releasedMedicines, setReleasedMedicines] = useState<MedicineReleased[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('')

  useEffect(() => {
    if (bhwAccount?.barangay) {
      fetchReleasedMedicines()
    } else if (account && !bhwAccount?.barangay) {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bhwAccount?.barangay, account])

  const fetchReleasedMedicines = async () => {
    if (!bhwAccount?.barangay) return

    try {
      setIsLoading(true)
      const releasedRef = collection(db, 'medicine-released')
      
      // Try query with orderBy first
      let querySnapshot
      try {
        const q = query(
          releasedRef, 
          where('barangay', '==', bhwAccount.barangay),
          orderBy('createdAt', 'desc')
        )
        querySnapshot = await getDocs(q)
      } catch (indexError: unknown) {
        // If index doesn't exist, query without orderBy and sort client-side
        if (indexError instanceof Error && (indexError.message.includes('failed-precondition') || indexError.message.includes('index'))) {
          console.warn('Composite index may not exist, fetching without orderBy')
          const q = query(
            releasedRef, 
            where('barangay', '==', bhwAccount.barangay)
          )
          querySnapshot = await getDocs(q)
        } else {
          throw indexError as Error
        }
      }
      
      const releasedData: MedicineReleased[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const released = {
          id: doc.id,
          ...data,
          releaseDate: data.releaseDate?.toDate?.() || (data.releaseDate instanceof Date ? data.releaseDate : new Date(data.releaseDate)),
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          barangay: data.barangay || ''
        } as MedicineReleased
        
        releasedData.push(released)
      })
      
      // Sort by createdAt desc if we didn't use orderBy in query
      if (releasedData.length > 0) {
        releasedData.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0)
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0)
          return bDate - aDate
        })
      }
      
      setReleasedMedicines(releasedData)
    } catch (error) {
      console.error('Error fetching released medicines:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter released medicines
  const filteredReleased = releasedMedicines.filter((released) => {
    const matchesSearch = searchTerm === '' || 
      released.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      released.medicineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (released.remarks && released.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDate = dateFilter === '' || 
      (released.releaseDate instanceof Date && 
       released.releaseDate.toISOString().split('T')[0] === dateFilter)
    
    return matchesSearch && matchesDate
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

  if (!bhwAccount?.barangay) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/bhw/medicine')}
            className="btn btn-ghost btn-sm"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-secondary">Released Medicines</h1>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Barangay information not found</p>
              <p className="text-sm text-gray-400">Please update your profile with your barangay assignment.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/bhw/medicine')}
          className="btn btn-ghost btn-sm"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-secondary">Released Medicines</h1>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing released medicines for <span className="font-semibold text-secondary">{bhwAccount.barangay}</span>
        </p>
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
                placeholder="Search by medicine name, code, or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>

            {/* Date Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Release Date</span>
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {filteredReleased.length === 0 ? (
            <div className="text-center py-8">
              {releasedMedicines.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-4">No released medicines found for your barangay</p>
                  <p className="text-sm text-gray-400">Released medicines will appear here once medicines are released to {bhwAccount.barangay}.</p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">No records match your search criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setDateFilter('')
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
                    <th>Date Released</th>
                    <th>Medicine Code</th>
                    <th>Medicine Name</th>
                    <th>Amount Released</th>
                    <th>Previous Quantity</th>
                    <th>New Quantity</th>
                    <th>Remarks</th>
                    <th>Recorded At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReleased.map((released) => (
                    <tr key={released.id} className="hover text-xs font-medium text-zinc-500">
                      <td>
                        <div className="font-medium">
                          {released.releaseDate instanceof Date 
                            ? released.releaseDate.toLocaleDateString() 
                            : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">
                          {released.medicineCode}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-zinc-600">
                          {released.medicineName}
                        </div>
                      </td>
                      <td>
                        <span className="font-bold text-primary">
                          {released.amount}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium">
                          {released.previousQuantity}
                        </span>
                      </td>
                      <td>
                        <span className={`font-medium ${released.newQuantity <= 10 ? 'text-error' : released.newQuantity <= 50 ? 'text-warning' : 'text-success'}`}>
                          {released.newQuantity}
                        </span>
                      </td>
                      <td>
                        <div className="max-w-xs truncate" title={released.remarks || 'No remarks'}>
                          {released.remarks || '—'}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs text-gray-500">
                          {released.createdAt instanceof Date 
                            ? released.createdAt.toLocaleString() 
                            : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
