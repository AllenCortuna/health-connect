'use client'

import React, { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { successToast, errorToast } from '@/lib/toast'
import type { Medicine } from '@/interface/data'
import { useRouter } from 'next/navigation'

export default function AdminAddMedicinePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Omit<Partial<Medicine>, 'expDate' | 'createdAt' | 'updatedAt'> & { expDate: string }>({
    medCode: '',
    quantity: 0,
    expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    name: '',
    description: '',
    medType: 'tablet',
    category: '',
    supplier: '',
    status: 'available'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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

    setIsLoading(true)
    try {
      const medicineData = {
        ...formData,
        quantity: Number(formData.quantity),
        expDate: new Date(formData.expDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, 'medicine'), medicineData)
      successToast('Medicine added successfully!')
      router.push('/admin/medicine')
    } catch (error) {
      console.error('Error adding medicine:', error)
      errorToast('Failed to add medicine. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl font-bold mb-6 text-secondary">Add New Medicine</h2>
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

            <div className="form-control flex flex-col gap-2">
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
                  value={formData.quantity || ''}
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
                onClick={() => router.back()}
                className="btn btn-outline btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Adding...
                  </>
                ) : (
                  'Add Medicine'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
