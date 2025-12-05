'use client'

import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { successToast, errorToast } from '@/lib/toast'
import type { Medicine } from '@/interface/data'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaArrowLeft, FaSave } from 'react-icons/fa'

export default function AdminEditMedicinePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const medicineId = searchParams.get('id')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [medicine, setMedicine] = useState<Medicine | null>(null)
  const [formData, setFormData] = useState<Omit<Partial<Medicine>, 'expDate' | 'createdAt' | 'updatedAt'> & { expDate: string }>({
    medCode: '',
    quantity: 0,
    expDate: '',
    name: '',
    description: '',
    medType: 'tablet',
    category: '',
    supplier: '',
    status: 'available'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (medicineId) {
      fetchMedicine()
    } else {
      errorToast('Medicine ID is required')
      router.push('/admin/medicine')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicineId])

  const fetchMedicine = async () => {
    try {
      setIsLoading(true)
      const medicineRef = doc(db, 'medicine', medicineId!)
      const medicineSnap = await getDoc(medicineRef)

      if (medicineSnap.exists()) {
        const data = medicineSnap.data()
        const medicineData: Medicine = {
          id: medicineSnap.id,
          ...data,
          expDate: data.expDate?.toDate?.() || data.expDate,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as Medicine

        setMedicine(medicineData)
        setFormData({
          medCode: medicineData.medCode || '',
          quantity: medicineData.quantity || 0,
          expDate: medicineData.expDate instanceof Date ? medicineData.expDate.toISOString().split('T')[0] : '',
          name: medicineData.name || '',
          description: medicineData.description || '',
          medType: medicineData.medType || 'tablet',
          category: medicineData.category || '',
          supplier: medicineData.supplier || '',
          status: medicineData.status || 'available'
        })
      } else {
        errorToast('Medicine not found')
        router.push('/admin/medicine')
      }
    } catch (error) {
      console.error('Error fetching medicine:', error)
      errorToast('Failed to fetch medicine data')
      router.push('/admin/medicine')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.medCode?.trim()) newErrors.medCode = 'Medicine Code is required'
    if (!formData.name?.trim()) newErrors.name = 'Medicine Name is required'
    if (!formData.description?.trim()) newErrors.description = 'Description is required'
    if (!formData.category?.trim()) newErrors.category = 'Category is required'
    if (!formData.supplier?.trim()) newErrors.supplier = 'Supplier is required'
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'
    if (formData.quantity && formData.quantity > 999999) newErrors.quantity = 'Quantity is too high'

    const selectedDate = new Date(formData.expDate)
    const today = new Date()
    if (selectedDate <= today) newErrors.expDate = 'Expiry date must be in the future'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let processedValue: string | number = value

    if (type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value)
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: processedValue }
      if (name === 'quantity') {
        const quantity = Number(processedValue)
        if (quantity === 0) updated.status = 'out of stock'
        else if (quantity > 0) updated.status = 'available'
      }
      return updated
    })

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      errorToast('Please fix the errors in the form')
      return
    }

    setIsSaving(true)
    try {
      const updateData = {
        ...formData,
        quantity: Number(formData.quantity),
        expDate: new Date(formData.expDate),
        updatedAt: new Date()
      }

      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData]
        }
      })

      const medicineRef = doc(db, 'medicine', medicineId!)
      await updateDoc(medicineRef, updateData)

      successToast('Medicine updated successfully!')
      router.push('/admin/medicine')
    } catch (error) {
      console.error('Error updating medicine:', error)
      errorToast('Failed to update medicine. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  if (!medicine) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-error">Medicine not found</p>
          <button
            onClick={() => router.push('/admin/medicine')}
            className="btn btn-secondary mt-4"
          >
            Back to Medicines
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/admin/medicine')}
          className="btn btn-ghost btn-sm"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-secondary">Edit Medicine</h1>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Medicine Code *</span>
                </label>
                <input
                  type="text"
                  name="medCode"
                  value={formData.medCode}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.medCode ? 'input-error' : ''}`}
                  placeholder="Enter Medicine Code"
                />
                {errors.medCode && <span className="label-text-alt text-error">{errors.medCode}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Medicine Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
                  placeholder="Enter Medicine Name"
                />
                {errors.name && <span className="label-text-alt text-error">{errors.name}</span>}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs">Description *</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`textarea textarea-bordered h-24 w-full text-xs ${errors.description ? 'textarea-error' : ''}`}
                placeholder="Enter Medicine Description"
              />
              {errors.description && <span className="label-text-alt text-error">{errors.description}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Medicine Type *</span>
                </label>
                <select
                  name="medType"
                  value={formData.medType}
                  onChange={handleInputChange}
                  className="select select-bordered"
                >
                  <option value="tablet">Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="syrup">Syrup</option>
                  <option value="inhaler">Inhaler</option>
                  <option value="ointment">Ointment</option>
                  <option value="injection">Injection</option>
                  <option value="drops">Drops</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Category *</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.category ? 'input-error' : ''}`}
                  placeholder="Enter Category"
                />
                {errors.category && <span className="label-text-alt text-error">{errors.category}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Supplier *</span>
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.supplier ? 'input-error' : ''}`}
                  placeholder="Enter Supplier Name"
                />
                {errors.supplier && <span className="label-text-alt text-error">{errors.supplier}</span>}
              </div>

              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Status *</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="select select-bordered"
                >
                  <option value="available">Available</option>
                  <option value="out of stock">Out of Stock</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Quantity *</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.quantity ? 'input-error' : ''}`}
                  placeholder="Enter Quantity"
                  min="1"
                  max="999999"
                />
                {errors.quantity && <span className="label-text-alt text-error">{errors.quantity}</span>}
              </div>
            </div>

            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-xs">Expiry Date *</span>
              </label>
              <input
                type="date"
                name="expDate"
                value={formData.expDate}
                onChange={handleInputChange}
                className={`input input-bordered ${errors.expDate ? 'input-error' : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.expDate && <span className="label-text-alt text-error">{errors.expDate}</span>}
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.push('/admin/medicine')}
                className="btn btn-outline btn-secondary"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
