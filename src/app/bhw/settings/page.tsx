'use client'

import React, { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { successToast, errorToast } from '@/lib/toast'
import { HiLockClosed, HiUser, HiEye, HiEyeOff } from 'react-icons/hi'
import { HiCog6Tooth } from 'react-icons/hi2'
import type { BHW } from '@/interface/user'
import { ToastContainer } from 'react-toastify'
import { BHWProfilePictureUploader } from '@/components/bhw/BHWProfilePictureUploader'

const BHWSettings = () => {
  const { account, setAccount } = useAccountStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [isLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    contactNumber: '',
    address: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female',
    status: 'single' as 'single' | 'married' | 'widowed' | 'separated' | 'divorced'
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Password visibility state
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Form errors
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (account) {
      const bhwAccount = account as unknown as BHW
      setProfileData({
        name: account.name || '',
        contactNumber: account.contactNumber || '',
        address: account.address || '',
        birthDate: bhwAccount.birthDate || '',
        gender: bhwAccount.gender || 'male',
        status: bhwAccount.status || 'single'
      })
    }
  }, [account])

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!profileData.name?.trim()) newErrors.name = 'Name is required'
    if (!profileData.address?.trim()) newErrors.address = 'Address is required'
    if (!profileData.birthDate?.trim()) newErrors.birthDate = 'Birth date is required'
    
    // Contact number validation (optional but if provided, should be valid)
    if (profileData.contactNumber && !/^(\+63|0)?[0-9]{10,11}$/.test(profileData.contactNumber.replace(/\s/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid contact number'
    }

    // Birth date validation
    if (profileData.birthDate) {
      const birthDate = new Date(profileData.birthDate)
      const today = new Date()
      if (birthDate >= today) {
        newErrors.birthDate = 'Birth date must be in the past'
      }
    }

    setProfileErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required'
    if (!passwordData.newPassword) newErrors.newPassword = 'New password is required'
    if (!passwordData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required'

    if (passwordData.newPassword && passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long'
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
    }

    setPasswordErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProfileForm()) {
      errorToast('Please fix the errors in the form')
      return
    }

    console.log("account", account);
    if (!account?.id) {
      errorToast('Account information not found')
      return
    }

    setIsSaving(true)
    
    try {
      const accountRef = doc(db, 'accounts', account.id)
      await updateDoc(accountRef, {
        ...profileData,
        birthDate: profileData.birthDate,
        updatedAt: new Date()
      })
      
      // Update the account store with new data
      const updatedAccount = {
        ...account,
        ...profileData,
        birthDate: profileData.birthDate
      }
      setAccount(updatedAccount)
      
      successToast('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      errorToast('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) {
      errorToast('Please fix the errors in the form')
      return
    }

    const user = auth.currentUser
    if (!user || !user.email) {
      errorToast('User not authenticated')
      return
    }

    setIsSaving(true)
    
    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword)
      await reauthenticateWithCredential(user, credential)
      
      // Update password
      await updatePassword(user, passwordData.newPassword)
      
      // Clear password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      successToast('Password updated successfully!')
    } catch (error: unknown) {
      console.error('Error updating password:', error)
      let errorMessage = 'Failed to update password. Please try again.'
      
      switch ((error as { code: string }).code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect'
          break
        case 'auth/weak-password':
          errorMessage = 'New password is too weak'
          break
        case 'auth/requires-recent-login':
          errorMessage = 'Please log in again before changing your password'
          break
      }
      
      errorToast(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <ToastContainer />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary flex items-center gap-2">
          <HiCog6Tooth />
          Settings
        </h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`btn ${activeTab === 'profile' ? 'btn-secondary text-white' : 'btn-outline text-secondary'}`}
          onClick={() => setActiveTab('profile')}
        >
          <HiUser className="mr-2" />
          Profile Information
        </button>
        <button
          className={`btn  ${activeTab === 'password' ? 'btn-secondary text-white' : 'btn-outline text-secondary'}`}
          onClick={() => setActiveTab('password')}
        >
          <HiLockClosed className="mr-2" />
          Change Password
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl font-bold text-secondary">Profile Information</h2>
            <p className="text-xs text-gray-600 mb-6">
              Update your personal information. Email cannot be changed for security reasons.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-8 items-start">
              <BHWProfilePictureUploader />

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Name */}
                <div className="form-control flex flex-col">
                  <label className="label">
                    <span className="label-text font-semibold text-xs">Full Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileInputChange}
                    className={`input input-bordered ${profileErrors.name ? 'input-error' : ''}`}
                    placeholder="Enter Full Name"
                  />
                  {profileErrors.name && <span className="label-text-alt text-error">{profileErrors.name}</span>}
                </div>

                {/* Contact Number */}
                <div className="form-control flex flex-col">
                  <label className="label">
                    <span className="label-text font-semibold text-xs">Contact Number</span>
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={profileData.contactNumber}
                    onChange={handleProfileInputChange}
                    className={`input input-bordered ${profileErrors.contactNumber ? 'input-error' : ''}`}
                    placeholder="Enter Contact Number"
                  />
                  {profileErrors.contactNumber && (
                    <span className="label-text-alt text-error">{profileErrors.contactNumber}</span>
                  )}
                </div>

                {/* Birth Date */}
                <div className="form-control flex flex-col">
                  <label className="label">
                    <span className="label-text font-semibold text-xs">Birth Date *</span>
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={profileData.birthDate}
                    onChange={handleProfileInputChange}
                    className={`input input-bordered ${profileErrors.birthDate ? 'input-error' : ''}`}
                  />
                  {profileErrors.birthDate && (
                    <span className="label-text-alt text-error">{profileErrors.birthDate}</span>
                  )}
                </div>

                {/* Gender and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control flex flex-col">
                    <label className="label">
                      <span className="label-text font-semibold text-xs">Gender *</span>
                    </label>
                    <select
                      name="gender"
                      value={profileData.gender}
                      onChange={handleProfileInputChange}
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
                      value={profileData.status}
                      onChange={handleProfileInputChange}
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
                    value={profileData.address}
                    onChange={handleProfileInputChange}
                    rows={3}
                    className={`textarea textarea-bordered ${profileErrors.address ? 'textarea-error' : ''}`}
                    placeholder="Enter Complete Address"
                  />
                  {profileErrors.address && (
                    <span className="label-text-alt text-error">{profileErrors.address}</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl font-bold mb-6 text-secondary">Change Password</h2>
            <p className="text-sm text-gray-600 mb-6">
              Update your password to keep your account secure. You&apos;ll need to enter your current password.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Current Password */}
              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Current Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className={`input input-bordered w-full pr-10 ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                    placeholder="Enter Current Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? <HiEyeOff className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && <span className="label-text-alt text-error">{passwordErrors.currentPassword}</span>}
              </div>

              {/* New Password */}
              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">New Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    className={`input input-bordered w-full pr-10 ${passwordErrors.newPassword ? 'input-error' : ''}`}
                    placeholder="Enter New Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? <HiEyeOff className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && <span className="label-text-alt text-error">{passwordErrors.newPassword}</span>}
              </div>

              {/* Confirm Password */}
              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Confirm New Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className={`input input-bordered w-full pr-10 ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm New Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? <HiEyeOff className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && <span className="label-text-alt text-error">{passwordErrors.confirmPassword}</span>}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                  className="btn btn-outline btn-secondary"
                  disabled={isSaving}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BHWSettings
