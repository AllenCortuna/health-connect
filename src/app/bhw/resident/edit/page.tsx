'use client'

import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { successToast, errorToast } from '@/lib/toast'
import type { Resident } from '@/interface/user'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaArrowLeft, FaSave } from 'react-icons/fa'
import { constructFullName } from '@/lib/objects'
import { getStatusFromAge } from '@/lib/ageUtils'

const EditResident = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const residentId = searchParams.get('id')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [resident, setResident] = useState<Resident | null>(null)
  const [formData, setFormData] = useState<Omit<Partial<Resident>, 'birthDate'> & { birthDate: string }>({
    fullName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: '',
    birthPlace: '',
    address: '',
    gender: 'male',
    marginalizedGroup: [],
    activeStatus: true,
    contactNumber: '',
    email: '',
    height: undefined,
    weight: undefined,
    bloodType: '',
    houseNo: '',
    spouseName: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (residentId) {
      fetchResident()
    } else {
      errorToast('Resident ID is required')
      router.push('/bhw/resident')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [residentId])

  const fetchResident = async () => {
    try {
      setIsLoading(true)
      const residentRef = doc(db, 'resident', residentId!)
      const residentSnap = await getDoc(residentRef)
      
      if (residentSnap.exists()) {
        const data = residentSnap.data()
        const residentData: Resident = {
          id: residentSnap.id,
          ...data,
          birthDate: data.birthDate?.toDate?.() || data.birthDate,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        } as Resident
        
        setResident(residentData)
        
        // Set form data
        setFormData({
          fullName: constructFullName(residentData.firstName, residentData.middleName, residentData.lastName, residentData.suffix),
          firstName: residentData.firstName || '',
          middleName: residentData.middleName || '',
          lastName: residentData.lastName || '',
          suffix: residentData.suffix || '',
          birthDate: residentData.birthDate instanceof Date 
            ? residentData.birthDate.toISOString().split('T')[0] 
            : '',
          birthPlace: residentData.birthPlace || '',
          address: residentData.address || '',
          gender: residentData.gender || 'male',
          marginalizedGroup: residentData.marginalizedGroup || [],
          activeStatus: residentData.activeStatus !== undefined ? residentData.activeStatus : true,
          contactNumber: residentData.contactNumber || '',
          email: residentData.email || '',
          height: residentData.height,
          weight: residentData.weight,
          bloodType: residentData.bloodType || '',
          houseNo: residentData.houseNo || '',
          spouseName: residentData.spouseName || ''
        })
      } else {
        errorToast('Resident not found')
        router.push('/bhw/resident')
      }
    } catch (error) {
      console.error('Error fetching resident:', error)
      errorToast('Failed to fetch resident data')
      router.push('/bhw/resident')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName?.trim()) newErrors.firstName = 'First Name is required'
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last Name is required'
    if (!formData.birthDate?.trim()) newErrors.birthDate = 'Birth Date is required'

    
    // Email validation (optional but if provided, should be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Contact number validation (optional but if provided, should be valid)
    if (formData.contactNumber && !/^(\+63|0)?[0-9]{10,11}$/.test(formData.contactNumber.replace(/\s/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid contact number'
    }

    // Height and weight validation
    if (formData.height && (formData.height < 50 || formData.height > 300)) {
      newErrors.height = 'Height must be between 50 and 300 cm'
    }
    if (formData.weight && (formData.weight < 1 || formData.weight > 500)) {
      newErrors.weight = 'Weight must be between 1 and 500 kg'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    const updatedFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    }
    
    // Update full name when name fields change
    if (['firstName', 'middleName', 'lastName', 'suffix'].includes(name)) {
      updatedFormData.fullName = constructFullName(
        updatedFormData.firstName || '', 
        updatedFormData.middleName, 
        updatedFormData.lastName || '', 
        updatedFormData.suffix
      )
    }
    
    setFormData(updatedFormData)
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleMarginalizedGroupChange = (value: string, checked: boolean) => {
    setFormData(prev => {
      const currentGroups = prev.marginalizedGroup || []
      const updatedGroups = checked
        ? [...currentGroups, value]
        : currentGroups.filter(g => g !== value)
      return {
        ...prev,
        marginalizedGroup: updatedGroups
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      errorToast('Please fix the errors in the form')
      return
    }

    setIsSaving(true)
    
    try {
      const parsedBirthDate = new Date(formData.birthDate)
      if (isNaN(parsedBirthDate.getTime())) {
        errorToast('Please provide a valid birth date')
        setIsSaving(false)
        return
      }

      // Auto-add age-based status to marginalizedGroup if not already present
      const ageStatus = getStatusFromAge(parsedBirthDate)
      const marginalizedGroup = [...(formData.marginalizedGroup || [])]
      
      // Add age-based status if not already in the array
      if (!marginalizedGroup.includes(ageStatus)) {
        marginalizedGroup.push(ageStatus)
      }

      const updateData = {
        ...formData,
        marginalizedGroup,
        fullName: constructFullName(formData.firstName || '', formData.middleName, formData.lastName || '', formData.suffix),
        birthDate: parsedBirthDate
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData]
        }
      })

      const residentRef = doc(db, 'resident', residentId!)
      await updateDoc(residentRef, updateData)
      
      successToast('Resident updated successfully!')
      router.push('/bhw/resident')
    } catch (error) {
      console.error('Error updating resident:', error)
      errorToast('Failed to update resident. Please try again.')
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

  if (!resident) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-error">Resident not found</p>
          <button
            onClick={() => router.back()}
            className="btn btn-secondary mt-4"
          >
            Back to Residents
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-secondary">Edit Resident</h1>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">First Name *</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.firstName ? 'input-error' : ''}`}
                  placeholder="Enter First Name"
                />
                {errors.firstName && <span className="label-text-alt text-error">{errors.firstName}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Middle Name</span>
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  placeholder="Enter Middle Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Last Name *</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.lastName ? 'input-error' : ''}`}
                  placeholder="Enter Last Name"
                />
                {errors.lastName && <span className="label-text-alt text-error">{errors.lastName}</span>}
              </div>

              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Suffix</span>
                </label>
                <input
                  type="text"
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  placeholder="e.g., Jr., Sr., III"
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Birth Date *</span>
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.birthDate ? 'input-error' : ''}`}
                />
                {errors.birthDate && <span className="label-text-alt text-error">{errors.birthDate}</span>}
              </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Birth Place *</span>
                </label>
                <input
                  type="text"
                  name="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.birthPlace ? 'input-error' : ''}`}
                  placeholder="Enter Birth Place"
                />
                {errors.birthPlace && <span className="label-text-alt text-error">{errors.birthPlace}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Marginalized Group</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {['pwd', 'pregnant', 'IPs', '4ps'].map((group) => (
                    <label key={group} className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        checked={formData.marginalizedGroup?.includes(group) || false}
                        onChange={(e) => handleMarginalizedGroupChange(group, e.target.checked)}
                        className="checkbox checkbox-primary checkbox-sm"
                      />
                      <span className="label-text text-xs capitalize">
                        {group === 'IPs' ? "IP's" : group === '4ps' ? '4Ps' : group === 'pwd' ? 'PWD' : group}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Status Toggle */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <span className="label-text font-semibold text-xs">Active Status</span>
                <input
                  type="checkbox"
                  name="activeStatus"
                  checked={formData.activeStatus || false}
                  onChange={handleInputChange}
                  className="toggle toggle-primary"
                />
                <span className="label-text text-xs text-gray-500">
                  {formData.activeStatus ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter Email Address"
                />
                {errors.email && <span className="label-text-alt text-error">{errors.email}</span>}
              </div>

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
            </div>

            {/* Address (optional) */}
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-xs">Complete Address</span>
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

            {/* Health Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Height (cm)</span>
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height || ''}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.height ? 'input-error' : ''}`}
                  placeholder="Height in cm"
                  min="50"
                  max="300"
                />
                {errors.height && <span className="label-text-alt text-error">{errors.height}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Weight (kg)</span>
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.weight ? 'input-error' : ''}`}
                  placeholder="Weight in kg"
                  min="1"
                  max="500"
                  step="0.1"
                />
                {errors.weight && <span className="label-text-alt text-error">{errors.weight}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Blood Type</span>
                </label>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className="select select-bordered"
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            {/* Spouse Information */}
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-xs">Spouse Name</span>
              </label>
              <input
                type="text"
                name="spouseName"
                value={formData.spouseName}
                onChange={handleInputChange}
                className="input input-bordered"
                placeholder="Enter Spouse Name"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
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
                    <span className="loading loading-spinner loading-sm"></span>
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

export default EditResident
