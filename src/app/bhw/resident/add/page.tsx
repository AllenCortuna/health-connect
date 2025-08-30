'use client'

import React, { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { successToast, errorToast } from '@/lib/toast'
import { Resident } from '@/interface/user'
import { useRouter } from 'next/navigation'

const AddResident = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Omit<Partial<Resident>, 'birthDate'> & { birthDate: string }>({
    idNo: '',
    fullName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: new Date().toISOString().split('T')[0],
    birthPlace: '',
    address: '',
    gender: 'male',
    status: 'adult',
    contactNumber: '',
    email: '',
    height: undefined,
    weight: undefined,
    bloodType: '',
    houseNo: '',
    spouseName: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.idNo?.trim()) newErrors.idNo = 'ID Number is required'
    if (!formData.firstName?.trim()) newErrors.firstName = 'First Name is required'
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last Name is required'
    if (!formData.birthPlace?.trim()) newErrors.birthPlace = 'Birth Place is required'
    if (!formData.address?.trim()) newErrors.address = 'Address is required'
    if (!formData.email?.trim()) newErrors.email = 'Email is required'
    
    // Email validation
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
      const residentData = {
        ...formData,
        createdAt: serverTimestamp(),
        fullName: formData.firstName + ' ' + formData.middleName + ' ' + formData.lastName + ' ' + formData?.suffix || '',
        birthDate: new Date(formData.birthDate as string)
      }

      await addDoc(collection(db, 'resident'), residentData)
      successToast('Resident added successfully!')
      router.push('/bhw/resident')
    } catch (error) {
      console.error('Error adding resident:', error)
      errorToast('Failed to add resident. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl font-bold mb-6 text-secondary">Add New Resident</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">ID Number *</span>
                </label>
                <input
                  type="text"
                  name="idNo"
                  value={formData.idNo}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.idNo ? 'input-error' : ''}`}
                  placeholder="Enter ID Number"
                />
                {errors.idNo && <span className="label-text-alt text-error">{errors.idNo}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">House Number</span>
                </label>
                <input
                  type="text"
                  name="houseNo"
                  value={formData.houseNo}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  placeholder="Enter House Number"
                />
              </div>
            </div>

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

              <div className="form-control">
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
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Birth Date *</span>
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
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
                  <span className="label-text font-semibold text-xs">Status *</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="select select-bordered"
                >
                  <option value="child">Child</option>
                  <option value="adult">Adult</option>
                  <option value="senior">Senior</option>
                  <option value="pwd">PWD</option>
                  <option value="pregnant">Pregnant</option>
                </select>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
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
                {errors.email && <span className="label-text-alt text-error">{errors.email}</span>}
              </div>

              <div className="form-control">
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

            {/* Address */}
            <div className="form-control">
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
            <div className="form-control">
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
                  'Add Resident'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddResident