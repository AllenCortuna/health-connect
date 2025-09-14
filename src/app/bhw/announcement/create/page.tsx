'use client'

import React, { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { successToast, errorToast } from '@/lib/toast'
import { Announcement } from '@/interface/data'
import { useRouter } from 'next/navigation'
import { useAccountStore } from '@/store/accountStore'
import { FaArrowLeft, FaSave } from 'react-icons/fa'

const CreateAnnouncement = () => {
  const router = useRouter()
  const { account } = useAccountStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Omit<Partial<Announcement>, 'id' | 'createdAt' | 'updatedAt'>>({
    createdBy: account?.name || 'Unknown',
    createdById: account?.id || '',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    important: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) newErrors.title = 'Title is required'
    if (!formData.content?.trim()) newErrors.content = 'Content is required'
    if (!formData.date?.trim()) newErrors.date = 'Date is required'
    if (!formData.time?.trim()) newErrors.time = 'Time is required'
    
    // Title length validation
    if (formData.title && formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less'
    }
    
    // Content length validation
    if (formData.content && formData.content.length > 2000) {
      newErrors.content = 'Content must be 2000 characters or less'
    }

    // Date validation
    if (formData.date) {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.date = 'Date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    let processedValue: string | boolean = value
    
    // Handle checkbox
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
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
      const announcementData = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, 'announcements'), announcementData)
      successToast('Announcement created successfully!')
      router.push('/bhw/announcement')
    } catch (error) {
      console.error('Error creating announcement:', error)
      errorToast('Failed to create announcement. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/bhw/announcement')}
          className="btn btn-ghost btn-sm"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-secondary">Create Announcement</h1>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div className="form-control flex flex-col gap-2">
              <label className="label">
                <span className="label-text font-semibold text-xs">Announcement Title *</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`input w-full input-bordered ${errors.title ? 'input-error' : ''}`}
                placeholder="Enter announcement title"
                maxLength={100}
              />
              {errors.title && <span className="label-text-alt text-error">{errors.title}</span>}
              <div className="label">
                <span className="label-text-alt text-xs text-gray-500">
                  {formData.title?.length || 0}/100 characters
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="form-control flex flex-col gap-2">
              <label className="label">
                <span className="label-text font-semibold text-xs">Content *</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className={`textarea textarea-xs w-full textarea-bordered h-32 ${errors.content ? 'textarea-error' : ''}`}
                placeholder="Enter announcement content"
                maxLength={2000}
              />
              {errors.content && <span className="label-text-alt text-error">{errors.content}</span>}
              <div className="label">
                <span className="label-text-alt text-xs text-gray-500">
                  {formData.content?.length || 0}/2000 characters
                </span>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control flex flex-col gap-2">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Date *</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.date ? 'input-error' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.date && <span className="label-text-alt text-error">{errors.date}</span>}
              </div>

              <div className="form-control flex flex-col gap-2">
                <label className="label">
                  <span className="label-text font-semibold text-xs">Time *</span>
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className={`input input-bordered ${errors.time ? 'input-error' : ''}`}
                />
                {errors.time && <span className="label-text-alt text-error">{errors.time}</span>}
              </div>
            </div>

            {/* Important Checkbox */}
            <div className="form-control">
              <label className="label cursor-pointer">
                <input
                  type="checkbox"
                  name="important"
                  checked={formData.important}
                  onChange={handleInputChange}
                  className="checkbox checkbox-secondary"
                />
                <span className="label-text font-semibold text-xs ml-3">
                  Mark as Important Announcement
                </span>
              </label>
            </div>

            {/* Preview Section */}
            {(formData.title || formData.content) && (
              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h4 className="card-title text-sm text-secondary mb-3">Preview</h4>
                  <div className="space-y-2">
                    {formData.title && (
                      <h3 className="text-lg font-semibold">{formData.title}</h3>
                    )}
                    {formData.content && (
                      <p className="text-sm whitespace-pre-wrap">{formData.content}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Created by: {formData.createdBy}</span>
                      {formData.date && formData.time && (
                        <span>• {new Date(`${formData.date}T${formData.time}`).toLocaleString()}</span>
                      )}
                      {formData.important && (
                        <span className="badge badge-error badge-xs">Important</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.push('/bhw/announcement')}
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
                    Creating...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Create Announcement
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

export default CreateAnnouncement
