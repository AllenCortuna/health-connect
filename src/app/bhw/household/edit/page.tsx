'use client'

import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { successToast, errorToast } from '@/lib/toast'
import { Household } from '@/interface/user'
import { useRouter, useSearchParams } from 'next/navigation'

const EditHousehold = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const householdId = searchParams.get('id')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [formData, setFormData] = useState<Omit<Household, 'id' | 'createdAt' | 'totalMembers'>>({
    householdNumber: '',
    address: '',
    headOfHousehold: '',
    email: '',
    totalFamily: 0,
    headOfHouseholdContactNumber: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [originalHouseholdNumber, setOriginalHouseholdNumber] = useState<string>('')
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)

  useEffect(() => {
    if (householdId) {
      fetchHousehold()
    } else {
      errorToast('No household ID provided')
      router.push('/bhw/household')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId])

  const fetchHousehold = async () => {
    if (!householdId) return

    try {
      setIsFetching(true)
      const householdRef = doc(db, 'household', householdId)
      const householdSnap = await getDoc(householdRef)
      
      if (householdSnap.exists()) {
        const data = householdSnap.data()
        const householdNumber = data.householdNumber || ''
        setOriginalHouseholdNumber(householdNumber)
        setFormData({
          householdNumber: householdNumber,
          address: data.address || '',
          headOfHousehold: data.headOfHousehold || '',
          headOfHouseholdContactNumber: data.headOfHouseholdContactNumber || '',
          totalFamily: data.totalFamily || 0,
          email: data.email || ''
        })
      } else {
        errorToast('Household not found')
        router.push('/bhw/household')
      }
    } catch (error) {
      console.error('Error fetching household:', error)
      errorToast('Failed to fetch household data')
    } finally {
      setIsFetching(false)
    }
  }

  const checkHouseholdNumberExists = async (householdNumber: string): Promise<boolean> => {
    if (!householdNumber.trim()) return false
    
    // If the household number hasn't changed, it's not a duplicate
    if (householdNumber.trim() === originalHouseholdNumber.trim()) {
      return false
    }
    
    try {
      setIsCheckingDuplicate(true)
      const householdsRef = collection(db, 'household')
      const q = query(householdsRef, where('householdNumber', '==', householdNumber.trim()))
      const querySnapshot = await getDocs(q)
      return !querySnapshot.empty
    } catch (error) {
      console.error('Error checking household number:', error)
      return false
    } finally {
      setIsCheckingDuplicate(false)
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    if (!formData.householdNumber?.trim()) {
      newErrors.householdNumber = 'Household Number is required'
    } else {
      // Check if household number already exists (excluding current household)
      const exists = await checkHouseholdNumberExists(formData.householdNumber)
      if (exists) {
        newErrors.householdNumber = 'Household Number already exists'
      }
    }
    
    if (!formData.address?.trim()) newErrors.address = 'Address is required'
    if (!formData.headOfHousehold?.trim()) newErrors.headOfHousehold = 'Head of Household is required'
    if (!formData.headOfHouseholdContactNumber?.trim()) {
      newErrors.headOfHouseholdContactNumber = 'Contact Number is required'
    } else {
      // Contact number validation - must be exactly 11 digits
      const cleanedNumber = formData.headOfHouseholdContactNumber.replace(/\s/g, '')
      if (!/^[0-9]{11}$/.test(cleanedNumber)) {
        newErrors.headOfHouseholdContactNumber = 'Contact number must be exactly 11 digits'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // For contact number, only allow numeric input and limit to 11 digits
    if (name === 'headOfHouseholdContactNumber') {
      const numericValue = value.replace(/\D/g, '').slice(0, 11)
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleHouseholdNumberBlur = async () => {
    if (formData.householdNumber.trim()) {
      const exists = await checkHouseholdNumberExists(formData.householdNumber)
      if (exists) {
        setErrors(prev => ({
          ...prev,
          householdNumber: 'Household Number already exists'
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Double-check if household number exists before submitting
    if (formData.householdNumber.trim() && formData.householdNumber.trim() !== originalHouseholdNumber.trim()) {
      const exists = await checkHouseholdNumberExists(formData.householdNumber)
      if (exists) {
        setErrors(prev => ({
          ...prev,
          householdNumber: 'Household Number already exists'
        }))
        errorToast('Household Number already exists. Please use a different number.')
        return
      }
    }
    
    if (!(await validateForm())) {
      errorToast('Please fix the errors in the form')
      return
    }

    if (!householdId) return

    setIsLoading(true)
    
    try {
      const householdRef = doc(db, 'household', householdId)
      await updateDoc(householdRef, formData)
      
      successToast('Household updated successfully!')
      router.push('/bhw/household')
    } catch (error) {
      console.error('Error updating household:', error)
      errorToast('Failed to update household. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl font-bold mb-6 text-secondary">Edit Household</h2>
          
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
                  onBlur={handleHouseholdNumberBlur}
                  className={`input input-bordered ${errors.householdNumber ? 'input-error' : ''}`}
                  placeholder="Enter Household Number"
                  disabled={isCheckingDuplicate}
                />
                {isCheckingDuplicate && (
                  <span className="label-text-alt text-info">Checking availability...</span>
                )}
                {errors.householdNumber && !isCheckingDuplicate && (
                  <span className="label-text-alt text-error">{errors.householdNumber}</span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Total Number of Family *</span>
                </label>
                <input
                  type="number"
                  name="totalFamily"
                  min="1"
                  max={10}
                  value={formData.totalFamily}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.totalFamily ? 'input-error' : ''}`}
                  placeholder="Enter Total Family"
                />
                {errors.totalFamily && <span className="label-text-alt text-error">{errors.totalFamily}</span>}
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
                <span className="label-text-alt text-xs text-warning drop-shadow w-80">Email required for household account creation</span>
                {errors.email && <span className="label-text-alt text-error">{errors.email}</span>}
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
                maxLength={11}
                className={`input input-bordered ${errors.headOfHouseholdContactNumber ? 'input-error' : ''}`}
                placeholder="Enter 11-digit Contact Number"
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
                disabled={isLoading || isCheckingDuplicate}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Updating...
                  </>
                ) : (
                  'Update Household'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditHousehold
