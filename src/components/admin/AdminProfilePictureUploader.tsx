'use client'

import React, { useState, useRef, ChangeEvent } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc } from 'firebase/firestore'
import { storage, db } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { successToast, errorToast } from '@/lib/toast'
import type { Account } from '@/interface/user'

interface AdminProfilePictureUploaderProps {
  readonly className?: string
}

export function AdminProfilePictureUploader(props: AdminProfilePictureUploaderProps) {
  const { className } = props
  const { account, setAccount } = useAccountStore()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!account || account.role !== 'admin') {
    return null
  }

  const adminAccount = account as Account
  const profilePictureUrl = adminAccount.profilePicture

  function handleChooseFileClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return
    if (!account?.id) {
      errorToast('Account information not found')
      return
    }

    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      errorToast('Please select a valid image file')
      return
    }

    const fileExtension = file.name.split('.').pop() || 'jpg'
    const storagePath = `admin-profile-pictures/${account.id}.${fileExtension}`

    setIsUploading(true)

    try {
      const storageRef = ref(storage, storagePath)
      await uploadBytes(storageRef, file)
      const downloadUrl = await getDownloadURL(storageRef)

      const accountRef = doc(db, 'accounts', account.id)
      await updateDoc(accountRef, {
        profilePicture: downloadUrl,
        updatedAt: new Date()
      })

      const updatedAccount: Account = {
        ...adminAccount,
        profilePicture: downloadUrl
      }
      setAccount(updatedAccount)

      successToast('Profile picture updated successfully!')
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      errorToast('Failed to upload profile picture. Please try again.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className || ''}`}>
      <div className="avatar">
        <div className="w-24 h-24 rounded-full ring ring-secondary ring-offset-base-100 ring-offset-2 overflow-hidden">
          {profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profilePictureUrl}
              alt="Profile picture"
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-base-200 text-secondary text-xl font-semibold">
              {adminAccount.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={handleChooseFileClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <span className="loading loading-spinner loading-xs mr-2" />
          ) : null}
          {isUploading ? 'Uploading...' : 'Change Photo'}
        </button>
        <p className="text-[10px] text-gray-500 text-center">
          JPG, PNG, or WebP. Max 5MB.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}


