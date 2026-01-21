'use client'

import React, { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { successToast, errorToast } from '@/lib/toast'
import { Household, Resident } from '@/interface/user'
import { useRouter } from 'next/navigation'
import { constructFullName } from '@/lib/objects'
import { FaArrowLeft } from 'react-icons/fa'
import { getStatusFromAge } from '@/lib/ageUtils'

const AddResident = () => {
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingHouseholds, setIsFetchingHouseholds] = useState(true)
  const [households, setHouseholds] = useState<Household[]>([])
  const [formData, setFormData] = useState<Omit<Partial<Resident>, 'birthDate'> & { birthDate: string }>({
    familyNo: '',
    fullName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: new Date().toISOString().split('T')[0],
    birthPlace: '',
    address: '',
    gender: 'male',
    marginalizedGroup: [],
    contactNumber: '',
    email: '',
    height: undefined,
    weight: undefined,
    bloodType: '',
    houseNo: '',
    spouseName: '',
    householdId: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [householdSearch, setHouseholdSearch] = useState('')
  const [showHouseholdDropdown, setShowHouseholdDropdown] = useState(false)

  useEffect(() => {
    fetchHouseholds()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.household-dropdown-container')) {
        setShowHouseholdDropdown(false)
      }
    }

    if (showHouseholdDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showHouseholdDropdown])

  // Filter households based on search term
  const filteredHouseholds = households.filter((household) => {
    if (!householdSearch.trim()) return true
    const searchLower = householdSearch.toLowerCase()
    return (
      household.householdNumber.toLowerCase().includes(searchLower) ||
      household.headOfHousehold.toLowerCase().includes(searchLower) ||
      household.address.toLowerCase().includes(searchLower)
    )
  })

  const handleHouseholdSelect = (household: Household) => {
    setFormData(prev => ({
      ...prev,
      householdId: household.householdNumber
    }))
    setHouseholdSearch(`${household.householdNumber} - ${household.headOfHousehold} (${household.address})`)
    setShowHouseholdDropdown(false)
    if (errors.householdId) {
      setErrors(prev => ({ ...prev, householdId: '' }))
    }
  }

  const handleHouseholdSearchChange = (value: string) => {
    setHouseholdSearch(value)
    setShowHouseholdDropdown(true)
    if (formData.householdId) {
      setFormData(prev => ({ ...prev, householdId: '' }))
    }
  }

  const fetchHouseholds = async () => {
    try {
      setIsFetchingHouseholds(true)
      const householdsRef = collection(db, 'household')
      const q = query(householdsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const householdsData: Household[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        householdsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        } as Household)
      })
      
      setHouseholds(householdsData)
    } catch (error) {
      console.error('Error fetching households:', error)
      errorToast('Failed to fetch households')
    } finally {
      setIsFetchingHouseholds(false)
    }
  }

  const updateHouseholdMemberCount = async (householdId: string) => {
    if (!householdId) return

    try {
      // Find the household
      const household = households.find(h => h.householdNumber === householdId)
      if (!household) return

      // Count current residents
      const residentsRef = collection(db, 'resident')
      const q = query(residentsRef, where('householdId', '==', householdId))
      const querySnapshot = await getDocs(q)
      const memberCount = querySnapshot.size

      // Update household member count
      const householdRef = doc(db, 'household', household.id)
      await updateDoc(householdRef, {
        totalMembers: memberCount
      })
    } catch (error) {
      console.error('Error updating household member count:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.householdId?.trim()) newErrors.householdId = 'Household is required'
    if (!formData.familyNo?.trim()) newErrors.familyNo = 'Family Number is required'
    if (!formData.firstName?.trim()) newErrors.firstName = 'First Name is required'
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last Name is required'
    if (!formData.birthPlace?.trim()) newErrors.birthPlace = 'Birth Place is required'
    if (!formData.address?.trim()) newErrors.address = 'Address is required'
    

    // Height and weight validation
    if (formData.height && (formData.height < 50 || formData.height > 300)) {
      newErrors.height = 'Height must be between 50 and 300 cm'
    }
    if (formData.weight && (formData.weight < 1 || formData.weight > 500)) {
      newErrors.weight = 'Weight must be between 1 and 500 kg'
    }

    // Family number validation against household totalFamily
    if (formData.householdId && formData.familyNo) {
      const selectedHousehold = households.find(h => h.householdNumber === formData.householdId)
      if (selectedHousehold && selectedHousehold.totalFamily) {
        const familyNo = parseInt(formData.familyNo)
        if (isNaN(familyNo) || familyNo < 1 || familyNo > selectedHousehold.totalFamily) {
          newErrors.familyNo = `Family Number must be between 1 and ${selectedHousehold.totalFamily}`
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const updatedFormData = {
      ...formData,
      [name]: value
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

    setIsLoading(true)
    
    try {
      // Auto-add age-based status to marginalizedGroup if not already present
      const parsedBirthDate = new Date(formData.birthDate as string)
      const ageStatus = getStatusFromAge(parsedBirthDate)
      const marginalizedGroup = [...(formData.marginalizedGroup || [])]
      
      // Add age-based status if not already in the array
      if (!marginalizedGroup.includes(ageStatus)) {
        marginalizedGroup.push(ageStatus)
      }

      const residentData = {
        ...formData,
        householdId: formData.householdId,
        marginalizedGroup,
        role: 'household' as const,
        activeStatus: true,
        createdAt: serverTimestamp(),
        fullName: constructFullName(formData.firstName || '', formData.middleName, formData.lastName || '', formData.suffix),
        birthDate: parsedBirthDate
      }

      await addDoc(collection(db, 'resident'), residentData)
      successToast('Resident added successfully!')
      
      // Update household member count
      if (formData.householdId) {
        await updateHouseholdMemberCount(formData.householdId)
      }
      
      // Reset form
      setFormData({
        familyNo: '',
        fullName: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        birthDate: new Date().toISOString().split('T')[0],
        birthPlace: '',
        address: '',
        gender: 'male',
        marginalizedGroup: [],
        contactNumber: '',
        email: '',
        height: undefined,
        weight: undefined,
        bloodType: '',
        houseNo: '',
        spouseName: '',
        householdId: ''
      })
      setHouseholdSearch('')
      setShowHouseholdDropdown(false)
      
      // Optionally navigate back or stay on page
      setTimeout(() => {
        router.push('/bhw/resident')
      }, 1500)
    } catch (error) {
      console.error('Error adding resident:', error)
      errorToast('Failed to add resident. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedHousehold = households.find(h => h.householdNumber === formData.householdId)

  if (isFetchingHouseholds) {
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
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/bhw/resident')}
          className="btn btn-ghost btn-sm"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-secondary">Add New Resident</h1>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Household Selection - Searchable Dropdown */}
            <div className="form-control relative household-dropdown-container">
              <label className="label">
                <span className="label-text font-semibold text-xs">Select Household *</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={householdSearch}
                  onChange={(e) => handleHouseholdSearchChange(e.target.value)}
                  onFocus={() => setShowHouseholdDropdown(true)}
                  placeholder="Search by household number, head of household, or address..."
                  className={`input input-bordered w-full ${errors.householdId ? 'input-error' : ''}`}
                />
                {showHouseholdDropdown && filteredHouseholds.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredHouseholds.map((household) => (
                      <button
                        key={household.id}
                        type="button"
                        onClick={() => handleHouseholdSelect(household)}
                        className="w-full text-left px-4 py-2 hover:bg-base-200 focus:bg-base-200 focus:outline-none border-b border-base-200 last:border-b-0"
                      >
                        <div className="font-medium text-sm">{household.householdNumber}</div>
                        <div className="text-xs text-gray-600">{household.headOfHousehold}</div>
                        <div className="text-xs text-gray-500 truncate">{household.address}</div>
                      </button>
                    ))}
                  </div>
                )}
                {showHouseholdDropdown && householdSearch.trim() && filteredHouseholds.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4">
                    <p className="text-sm text-gray-500">
                      No households found matching {`"${householdSearch}"`}
                    </p>
                  </div>
                )}
              </div>
              {errors.householdId && <span className="label-text-alt text-error">{errors.householdId}</span>}
              {selectedHousehold && (
                <div className="mt-2 p-3 bg-base-200 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Selected Household:</span> {selectedHousehold.headOfHousehold} | 
                    Total Families: {selectedHousehold.totalFamily} | 
                    Current Members: {selectedHousehold.totalMembers}
                  </p>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Family Number *</span>
                </label>
                <input
                  type="number"
                  name="familyNo"
                  value={formData.familyNo}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.familyNo ? 'input-error' : ''}`}
                  placeholder="Enter Family Number"
                  min="1"
                  max={selectedHousehold?.totalFamily || 999}
                />
                {errors.familyNo && <span className="label-text-alt text-error">{errors.familyNo}</span>}
                {selectedHousehold && (
                  <span className="label-text-alt text-gray-500">
                    Must be between 1 and {selectedHousehold.totalFamily}
                  </span>
                )}
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {['pwd', 'pregnant', 'IPs', '4ps', 'solo parent'].map((group) => (
                    <label key={group} className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        checked={formData.marginalizedGroup?.includes(group) || false}
                        onChange={(e) => handleMarginalizedGroupChange(group, e.target.checked)}
                        className="checkbox checkbox-primary checkbox-sm"
                      />
                      <span className="label-text text-xs capitalize">
                        {group === 'IPs'
                          ? "IP's"
                          : group === '4ps'
                            ? '4Ps'
                            : group === 'pwd'
                              ? 'PWD'
                              : group === 'solo parent'
                                ? 'Solo Parent'
                                : group}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className={`textarea textarea-bordered h-16 ${errors.address ? 'textarea-error' : ''}`}
                placeholder="Enter Complete Address"
              />
              {errors.address && <span className="label-text-alt text-error">{errors.address}</span>}
            </div>

            {/* Health Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/bhw/resident')}
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
