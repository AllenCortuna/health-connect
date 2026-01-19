'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'

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
  barangay?: string
}

export default function ReleasedMedicinesPage() {
  const router = useRouter()
  const [releasedMedicines, setReleasedMedicines] = useState<MedicineReleased[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [barangayFilter, setBarangayFilter] = useState<string>('all')

  useEffect(() => {
    fetchReleasedMedicines()
  }, [])

  const fetchReleasedMedicines = async () => {
    try {
      setIsLoading(true)
      const releasedRef = collection(db, 'medicine-released')
      const q = query(releasedRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
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

    const matchesBarangay =
      barangayFilter === 'all' ||
      (released.barangay || '').toLowerCase() === barangayFilter.toLowerCase()
    
    return matchesSearch && matchesDate && matchesBarangay
  })

  const barangayOptions = Array.from(
    new Set(
      releasedMedicines
        .map((r) => (r.barangay || '').trim())
        .filter((b) => b !== '')
    )
  ).sort()

  const groupedByBarangay = filteredReleased.reduce<Record<string, MedicineReleased[]>>(
    (acc, released) => {
      const key = (released.barangay || 'Unspecified').trim() || 'Unspecified'
      if (!acc[key]) acc[key] = []
      acc[key].push(released)
      return acc
    },
    {}
  )

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
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/admin/medicine')}
          className="btn btn-ghost btn-sm"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-secondary">Released Medicines</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="form-control flex flex-col">
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
            <div className="form-control flex flex-col">
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

            {/* Barangay Filter */}
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Barangay</span>
              </label>
              <select
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Barangays</option>
                {barangayOptions.map((bgy) => (
                  <option key={bgy} value={bgy}>
                    {bgy}
                  </option>
                ))}
              </select>
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
                  <p className="text-gray-500 mb-4">No released medicines found</p>
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
                    <th>Barangay</th>
                    <th>Previous Quantity</th>
                    <th>New Quantity</th>
                    <th>Remarks</th>
                    <th>Recorded At</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedByBarangay)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([barangay, rows]) => (
                      <React.Fragment key={barangay}>
                        <tr className="bg-base-200">
                          <td colSpan={9} className="text-xs font-semibold text-secondary uppercase">
                            {barangay}
                          </td>
                        </tr>
                        {rows.map((released) => (
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
                              <div className="font-medium">
                                {released.barangay || 'N/A'}
                              </div>
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
                      </React.Fragment>
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
