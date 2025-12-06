'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Medicine } from '@/interface/data'
import { useRouter } from 'next/navigation'
import { FaPlus } from 'react-icons/fa'
import StatusBadge from '@/components/common/StatusBadge'
import ViewMedicineModal from '@/components/bhw/ViewMedicineModal'
import ReleaseMedicineModal from '@/components/admin/ReleaseMedicineModal'
import { successToast, errorToast } from '@/lib/toast'

const Medicine = () => {
  const router = useRouter()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [medicineToRelease, setMedicineToRelease] = useState<Medicine | null>(null)
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async () => {
    try {
      setIsLoading(true)
      const medicinesRef = collection(db, 'medicine')
      const q = query(medicinesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const medicinesData: Medicine[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const medicine = {
          id: doc.id,
          ...data,
          expDate: data.expDate?.toDate?.() || data.expDate,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as Medicine
        
        // Auto-update status based on quantity for consistency
        if (medicine.quantity === 0) {
          medicine.status = 'out of stock'
        } else if (medicine.quantity > 0) {
          medicine.status = 'available'
        }
        
        medicinesData.push(medicine)
      })
      
      setMedicines(medicinesData)
    } catch (error) {
      console.error('Error fetching medicines:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedMedicine(null)
  }

  const openReleaseModal = (medicine: Medicine) => {
    setMedicineToRelease(medicine)
    setIsReleaseModalOpen(true)
  }

  const closeReleaseModal = () => {
    setIsReleaseModalOpen(false)
    setMedicineToRelease(null)
  }

  const handleReleaseMedicine = async (amount: number, date: Date, remarks: string) => {
    if (!medicineToRelease) return

    setIsReleasing(true)
    try {
      // Validate again before releasing
      if (amount > medicineToRelease.quantity) {
        errorToast('Cannot release more than available quantity')
        return
      }

      // Check if expired
      if (medicineToRelease.expDate instanceof Date) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const expDate = new Date(medicineToRelease.expDate)
        expDate.setHours(0, 0, 0, 0)
        
        if (expDate <= today) {
          errorToast('Cannot release expired medicine')
          return
        }
      }

      // Calculate new quantity
      const newQuantity = medicineToRelease.quantity - amount
      const newStatus = newQuantity === 0 ? 'out of stock' : 'available'

      // Update medicine quantity and status
      const medicineRef = doc(db, 'medicine', medicineToRelease.id)
      await updateDoc(medicineRef, {
        quantity: newQuantity,
        status: newStatus,
        updatedAt: serverTimestamp()
      })

      // Create release record
      await addDoc(collection(db, 'medicine-released'), {
        medicineId: medicineToRelease.id,
        medicineCode: medicineToRelease.medCode,
        medicineName: medicineToRelease.name,
        amount: amount,
        releaseDate: date,
        remarks: remarks || '',
        previousQuantity: medicineToRelease.quantity,
        newQuantity: newQuantity,
        createdAt: serverTimestamp()
      })

      successToast('Medicine released successfully!')
      closeReleaseModal()
      fetchMedicines() // Refresh the list
    } catch (error) {
      console.error('Error releasing medicine:', error)
      errorToast('Failed to release medicine. Please try again.')
    } finally {
      setIsReleasing(false)
    }
  }

  // Filter and search medicines
  const filteredMedicines = medicines.filter((medicine) => {
    const matchesSearch = searchTerm === '' || 
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.medCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || medicine.status === statusFilter
    const matchesType = typeFilter === 'all' || medicine.medType === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
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
        <h1 className="text-2xl font-bold text-secondary">Medicines</h1>
        <button
          onClick={() => router.push('/admin/medicine/released')}
          className="btn btn-secondary btn-sm ml-auto mr-5"
        >
          View Released Medicines
        </button>
        <button
          onClick={() => router.push('/admin/medicine/add')}
          className="btn btn-secondary btn-sm"
        >
          <FaPlus className="mr-2" />
          Add Medicine
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Search</span>
              </label>
              <input
                type="text"
                placeholder="Search by name, code, or description..."
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
                <option value="available">Available</option>
                <option value="out of stock">Out of Stock</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Type</span>
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Types</option>
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="syrup">Syrup</option>
                <option value="inhaler">Inhaler</option>
                <option value="ointment">Ointment</option>
                <option value="injection">Injection</option>
                <option value="drops">Drops</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {filteredMedicines.length === 0 ? (
            <div className="text-center py-8">
              {medicines.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-4">No medicines found</p>
                  <button
                    onClick={() => router.push('/admin/medicine/add')}
                    className="btn btn-secondary"
                  >
                    <FaPlus className="mr-2" />
                    Add First Medicine
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">No medicines match your search criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setTypeFilter('all')
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
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Quantity</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((medicine) => (
                    <tr key={medicine.id} className="hover text-xs font-medium text-zinc-500">
                      <td>
                        <div className="font-medium">
                          {medicine.medCode}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">
                          {medicine.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {medicine.description}
                        </div>
                      </td>
                      <td>
                        <span className="capitalize badge badge-outline badge-sm">
                          {medicine.medType}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={medicine.status} size="xs" />
                      </td>
                      <td>
                        <span className={`font-medium ${medicine.quantity <= 10 ? 'text-error' : medicine.quantity <= 50 ? 'text-warning' : 'text-success'}`}>
                          {medicine.quantity}
                        </span>
                      </td>
                      <td>
                        <span className={`font-medium ${medicine.expDate instanceof Date && medicine.expDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-error' : ''}`}>
                          {medicine.expDate instanceof Date ? medicine.expDate.toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(medicine)}
                          className="btn btn-outline btn-secondary btn-xs"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openReleaseModal(medicine)}
                          className="btn btn-outline btn-primary btn-xs"
                          title="Release Medicine"
                          disabled={medicine.quantity === 0 || (medicine.expDate instanceof Date && medicine.expDate <= new Date())}
                        >
                          Release
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

      {/* View Medicine Modal */}
      <ViewMedicineModal
        medicine={selectedMedicine}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      {/* Release Medicine Modal */}
      <ReleaseMedicineModal
        medicine={medicineToRelease}
        isOpen={isReleaseModalOpen}
        onClose={closeReleaseModal}
        onRelease={handleReleaseMedicine}
        isReleasing={isReleasing}
      />
    </div>
  )
}

export default Medicine