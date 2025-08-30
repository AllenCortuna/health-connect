'use client'

import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { successToast, errorToast } from '@/lib/toast'
import type { BHW } from '@/interface/user'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaArrowLeft, FaSave } from 'react-icons/fa'

const EditBHW = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bhwId = searchParams.get('id')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [bhw, setBhw] = useState<BHW | null>(null)
  const [formData, setFormData] = useState<Omit<Partial<BHW>, 'createdAt'>>({
    name: '',
    contactNumber: '',
    address: '',
    age: 18,
    gender: 'male',
    status: 'single'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (bhwId) {
      fetchBHW()
    } else {
      errorToast('BHW ID is required')
      router.push('/admin/bhw')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bhwId])

  const fetchBHW = async () => {
    try {
      setIsLoading(true)
      const bhwRef = doc(db, 'accounts', bhwId!)
      const bhwSnap = await getDoc(bhwRef)
      
      if (bhwSnap.exists()) {
        const data = bhwSnap.data()
        if (data.role !== 'bhw') {
          errorToast('Invalid BHW record')
          router.push('/admin/bhw')
          return
        }
        
        const bhwData: BHW = {
          id: bhwSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        } as BHW
        
        setBhw(bhwData)
        
        // Set form data
        setFormData({
          name: bhwData.name || '',
          contactNumber: bhwData.contactNumber || '',
          address: bhwData.address || '',
          age: bhwData.age || 18,
          gender: bhwData.gender || 'male',
          status: bhwData.status || 'single'
        })
      } else {
        errorToast('BHW not found')
        router.push('/admin/bhw')
      }
    } catch (error) {
      console.error('Error fetching BHW:', error)
      errorToast('Failed to fetch BHW data')
      router.push('/admin/bhw')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) newErrors.name = 'Name is required'
    if (!formData.address?.trim()) newErrors.address = 'Address is required'
    
    // Contact number validation (optional but if provided, should be valid)
    if (formData.contactNumber && !/^(\+63|0)?[0-9]{10,11}$/.test(formData.contactNumber.replace(/\s/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid contact number'
    }

    // Age validation
    if (formData.age && (formData.age < 18 || formData.age > 100)) {
      newErrors.age = 'Age must be between 18 and 100 years'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 18 : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      errorToast('Please fix the errors in the form')
      return
    }

    setIsSaving(true)
    
    try {
      const bhwRef = doc(db, 'accounts', bhwId!)
      await updateDoc(bhwRef, {
        ...formData,
        updatedAt: new Date()
      })
      
      successToast('BHW updated successfully!')
      router.push('/admin/bhw')
    } catch (error) {
      console.error('Error updating BHW:', error)
      errorToast('Failed to update BHW. Please try again.')
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

  if (!bhw) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">BHW not found</p>
          <button
            onClick={() => router.push('/admin/bhw')}
            className="btn btn-secondary"
          >
            Back to BHW List
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/admin/bhw')}
              className="btn btn-outline btn-secondary btn-sm"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>
            <h2 className="card-title text-xl font-bold text-secondary">Edit Barangay Health Worker</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Full Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
                  placeholder="Enter Full Name"
                />
                {errors.name && <span className="label-text-alt text-error">{errors.name}</span>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Contact Number</span>
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.contactNumber ? 'input-error' : ''}`}
                  placeholder="Enter Contact Number"
                />
                {errors.contactNumber && <span className="label-text-alt text-error">{errors.contactNumber}</span>}
              </div>

              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Age *</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="18"
                  max="100"
                  className={`input input-bordered ${errors.age ? 'input-error' : ''}`}
                  placeholder="Enter Age"
                />
                {errors.age && <span className="label-text-alt text-error">{errors.age}</span>}
              </div>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Gender *</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="select select-bordered"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Marital Status *</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="select select-bordered"
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                  <option value="divorced">Divorced</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-xs">Address *</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className={`textarea textarea-bordered ${errors.address ? 'textarea-error' : ''}`}
                placeholder="Enter Complete Address"
              />
              {errors.address && <span className="label-text-alt text-error">{errors.address}</span>}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/admin/bhw')}
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
                  <span className="loading loading-spinner loading-sm"></span>
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

export default EditBHW
