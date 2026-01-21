'use client'

import React, { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { successToast, errorToast } from '@/lib/toast'
import { Household, Resident } from '@/interface/user'
import { useRouter, useSearchParams } from 'next/navigation'
import { constructFullName } from '@/lib/objects'
import { FaTrash, FaEdit } from 'react-icons/fa'
import Link from 'next/link'
import { getStatusFromAge } from '@/lib/ageUtils'

const EditHouseholdMember = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const householdNumber = searchParams.get('householdNumber')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [residents, setResidents] = useState<Resident[]>([])
  const [householdInfo, setHouseholdInfo] = useState<Household | null>(null)
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
    householdId: householdNumber || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [residentToDelete, setResidentToDelete] = useState<Resident | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (householdNumber) {
      fetchHouseholdInfo()
      fetchResidents()
    } else {
      errorToast('No household number provided')
      router.push('/bhw/household')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdNumber])

  const fetchHouseholdInfo = async () => {
    if (!householdNumber) return

    try {
      const householdsRef = collection(db, 'household')
      const q = query(householdsRef, where('householdNumber', '==', householdNumber))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        const data = doc.data()
        setHouseholdInfo({
          id: doc.id,
          totalFamily: data.totalFamily || 0,
          householdNumber: data.householdNumber || '',
          address: data.address || '',
          email: data.email || '',
          totalMembers: data.totalMembers || 0,
          headOfHousehold: data.headOfHousehold || '',
          headOfHouseholdContactNumber: data.headOfHouseholdContactNumber || ''
        })
      } else {
        errorToast('Household not found')
        router.push('/bhw/household')
      }
    } catch (error) {
      console.error('Error fetching household info:', error)
      errorToast('Failed to fetch household information')
    }
  }

  const fetchResidents = async () => {
    if (!householdNumber) return

    try {
      setIsFetching(true)
      const residentsRef = collection(db, 'resident')
      const q = query(residentsRef, where('householdId', '==', householdNumber))
      const querySnapshot = await getDocs(q)
      
      const residentsData: Resident[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        residentsData.push({
          id: doc.id,
          ...data,
          birthDate: data.birthDate?.toDate?.() || data.birthDate,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        } as Resident)
      })
      
      setResidents(residentsData)
      
      // Update household member count
      await updateHouseholdMemberCount(residentsData.length)
    } catch (error) {
      console.error('Error fetching residents:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const updateHouseholdMemberCount = async (memberCount: number) => {
    if (!householdNumber || !householdInfo) return

    try {
      const householdRef = doc(db, 'household', householdInfo.id)
      await updateDoc(householdRef, {
        totalMembers: memberCount
      })
      
      // Update local household info
      setHouseholdInfo(prev => prev ? { ...prev, totalMembers: memberCount } : null)
    } catch (error) {
      console.error('Error updating household member count:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.familyNo?.trim()) newErrors.familyNo = 'Family Number is required'
    if (!formData.firstName?.trim()) newErrors.firstName = 'First Name is required'
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last Name is required'
    if (!formData.birthPlace?.trim()) newErrors.birthPlace = 'Birth Place is required'
    
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
        householdId: householdNumber,
        marginalizedGroup,
        role: 'household' as const,
        activeStatus: true,
        createdAt: serverTimestamp(),
        fullName: constructFullName(formData.firstName || '', formData.middleName, formData.lastName || '', formData.suffix),
        birthDate: parsedBirthDate
      }

      await addDoc(collection(db, 'resident'), residentData)
      successToast('Resident added successfully!')
      
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
        householdId: householdNumber || ''
      })
      
      // Refresh residents list and update member count
      fetchResidents()
    } catch (error) {
      console.error('Error adding resident:', error)
      errorToast('Failed to add resident. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const openDeleteModal = (resident: Resident) => {
    setResidentToDelete(resident)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setResidentToDelete(null)
  }

  const handleDeleteResident = async () => {
    if (!residentToDelete) return

    setIsDeleting(true)
    try {
      const residentRef = doc(db, 'resident', residentToDelete.id)
      await deleteDoc(residentRef)
      
      successToast('Resident deleted successfully!')
      closeDeleteModal()
      
      // Refresh the list and update member count
      fetchResidents()
    } catch (error) {
      console.error('Error deleting resident:', error)
      errorToast('Failed to delete resident. Please try again.')
    } finally {
      setIsDeleting(false)
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
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Household Info Header */}
      {householdInfo && (
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-secondary">
                  Household {householdInfo.householdNumber}
                </h1>
                <p className="text-gray-600">
                  Head: {householdInfo.headOfHousehold} | 
                  Address: {householdInfo.address}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge badge-primary badge-sm">
                    {householdInfo.totalMembers} {householdInfo.totalMembers === 1 ? 'Member' : 'Members'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => router.push('/bhw/household')}
                className="btn btn-outline btn-secondary"
              >
                Back to Households
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New Member Form */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl font-bold mb-6 text-secondary">Add New Member</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-xs">Family Number</span>
                  </label>
                  <input
                    type="number"
                    name="familyNo"
                    value={formData.familyNo}
                    onChange={handleInputChange}
                    className="input input-bordered input-sm"
                    placeholder="Enter Family Number"
                    min="1"
                    max={householdInfo?.totalFamily}
                  />
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
                    className={`input input-bordered input-sm ${errors.firstName ? 'input-error' : ''}`}
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
                    className="input input-bordered input-sm"
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
                    className={`input input-bordered input-sm ${errors.lastName ? 'input-error' : ''}`}
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
                    className="input input-bordered input-sm"
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
                    className="input input-bordered input-sm"
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
                    className="select select-bordered select-sm"
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
                    className={`input input-bordered input-sm ${errors.birthPlace ? 'input-error' : ''}`}
                    placeholder="Enter Birth Place"
                  />
                  {errors.birthPlace && <span className="label-text-alt text-error">{errors.birthPlace}</span>}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-xs">Marginalized Group</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['pwd', 'pregnant', 'IPs', '4ps', 'solo parent'].map((group) => (
                      <label key={group} className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          checked={formData.marginalizedGroup?.includes(group) || false}
                          onChange={(e) => handleMarginalizedGroupChange(group, e.target.checked)}
                          className="checkbox checkbox-primary checkbox-sm"
                        />
                        <span className="label-text text-xs capitalize">
                          {group === 'IPs' ? "IP's" : group === '4ps' ? '4Ps' : group === 'pwd' ? 'PWD' : group === 'solo parent' ? 'Solo Parent' : group}
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
                    <span className="label-text font-semibold text-xs">Email (Optional)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input input-bordered input-sm ${errors.email ? 'input-error' : ''}`}
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
                    className={`input input-bordered input-sm ${errors.contactNumber ? 'input-error' : ''}`}
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
                  className={`textarea textarea-bordered textarea-sm h-16 ${errors.address ? 'textarea-error' : ''}`}
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
                    className={`input input-bordered input-sm ${errors.height ? 'input-error' : ''}`}
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
                    className={`input input-bordered input-sm ${errors.weight ? 'input-error' : ''}`}
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
                    className="select select-bordered select-sm"
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
                  className="input input-bordered input-sm"
                  placeholder="Enter Spouse Name"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="submit"
                  className="btn btn-secondary btn-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Adding...
                    </>
                  ) : (
                    'Add Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Current Members List */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl font-bold mb-6 text-secondary">
              Current Members ({residents.length})
            </h2>
            
            {residents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No members added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {residents.map((resident) => (
                  <div key={resident.id} className="card bg-base-200 shadow-sm">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{resident.fullName}</h3>
                          <p className="text-xs text-gray-600">Family Number: {resident.familyNo}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs capitalize">{resident.gender}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {resident.marginalizedGroup && resident.marginalizedGroup.length > 0 ? (
                              resident.marginalizedGroup.map((group) => (
                                <span
                                  key={group}
                                  className="badge badge-sm badge-outline"
                                  title={group}
                                >
                                  {group === 'IPs'
                                    ? "IP's"
                                    : group === '4ps'
                                      ? '4Ps'
                                      : group === 'pwd'
                                        ? 'PWD'
                                        : group === 'solo parent'
                                          ? 'Solo Parent'
                                          : group.charAt(0).toUpperCase() + group.slice(1)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/bhw/resident/edit?id=${resident.id}`}
                            className="btn btn-outline btn-secondary btn-xs"
                            title="Edit Resident"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(resident)}
                            className="btn btn-outline btn-error btn-xs"
                            title="Delete Resident"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Resident Modal */}
      {isDeleteModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Resident</h3>
            <p className="py-4">
              Are you sure you want to delete <strong>{residentToDelete?.fullName}</strong>? 
              This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                onClick={closeDeleteModal}
                className="btn btn-outline"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResident}
                className="btn btn-error"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditHouseholdMember
