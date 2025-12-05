'use client'

import React, { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { successToast, errorToast } from '@/lib/toast'
import { Household } from '@/interface/user'
import { useRouter } from 'next/navigation'

const AddHousehold = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Omit<Household, 'id' | 'createdAt' | 'totalMembers'>>({
    householdNumber: '',
    address: '',
    headOfHousehold: '',
    headOfHouseholdContactNumber: '',
    email: '',
    totalFamily: 1
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.householdNumber?.trim()) newErrors.householdNumber = 'Household Number is required'
    if (!formData.address?.trim()) newErrors.address = 'Address is required'
    if (!formData.headOfHousehold?.trim()) newErrors.headOfHousehold = 'Head of Household is required'
    if (!formData.headOfHouseholdContactNumber?.trim()) newErrors.headOfHouseholdContactNumber = 'Contact Number is required'
    
    // Contact number validation
    if (formData.headOfHouseholdContactNumber && !/^(\+63|0)?[0-9]{10,11}$/.test(formData.headOfHouseholdContactNumber.replace(/\s/g, ''))) {
      newErrors.headOfHouseholdContactNumber = 'Please enter a valid contact number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    setIsLoading(true)
    
    try {
      const householdData = {
        ...formData,
        totalMembers: 0, // Start with 0 members
        role: 'household',
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, 'household'), householdData)
      successToast('Household added successfully!')
      router.push('/bhw/household')
    } catch (error) {
      console.error('Error adding household:', error)
      errorToast('Failed to add household. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl font-bold mb-6 text-secondary">Add New Household</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Household Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Household Number *</span>
                </label>
                <input
                  type="text"
                  name="householdNumber"
                  value={formData.householdNumber}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.householdNumber ? 'input-error' : ''}`}
                  placeholder="Enter Household Number"
                />
                {errors.householdNumber && <span className="label-text-alt text-error">{errors.householdNumber}</span>}
              </div>

              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Email *</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter Email Address"
                />
                <span className="label-text-alt text-[10px] text-warning drop-shadow w-80">Email required for household account creation</span>
                {errors.email && <span className="label-text-alt text-error">{errors.email}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Total Number of Family *</span>
                </label>
                <input
                  type="number"
                  name="totalFamily"
                  min="1"
                  max="10"
                  value={formData.totalFamily}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.totalFamily ? 'input-error' : ''}`}
                  placeholder="Enter Total Number of Family"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Head of Household *</span>
                </label>
                <input
                  type="text"
                  name="headOfHousehold"
                  value={formData.headOfHousehold}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.headOfHousehold ? 'input-error' : ''}`}
                  placeholder="Enter Head of Household Name"
                />
                {errors.headOfHousehold && <span className="label-text-alt text-error">{errors.headOfHousehold}</span>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-xs">Head of Household Contact Number *</span>
              </label>
              <input
                type="tel"
                name="headOfHouseholdContactNumber"
                value={formData.headOfHouseholdContactNumber}
                onChange={handleInputChange}
                className={`input input-bordered ${errors.headOfHouseholdContactNumber ? 'input-error' : ''}`}
                placeholder="Enter Contact Number"
              />
              {errors.headOfHouseholdContactNumber && <span className="label-text-alt text-error">{errors.headOfHouseholdContactNumber}</span>}
            </div>

            {/* Address */}
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-xs">Complete Address *</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`textarea textarea-bordered h-24 ${errors.address ? 'textarea-error' : ''}`}
                placeholder="Enter Complete Address"
              />
              {errors.address && <span className="label-text-alt text-error">{errors.address}</span>}
            </div>

            {/* Form Actions */}
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
                    <span className="loading loading-spinner loading-sm"></span>
                    Adding...
                  </>
                ) : (
                  'Add Household'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddHousehold
