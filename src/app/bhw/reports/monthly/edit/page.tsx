'use client'

import React, { useState, useRef, useEffect } from 'react'
import { getDoc, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { successToast, errorToast } from '@/lib/toast'
import type { MonthlyReport } from '@/interface/data'
import type { BHW } from '@/interface/user'
import { FaArrowLeft, FaTrash, FaFilePdf, FaImage, FaUpload } from 'react-icons/fa'
import { format, parseISO } from 'date-fns'

interface FileWithPreview {
  file: File | null
  preview: string | null
  type: 'image' | 'pdf'
  uploadUrl?: string
  isUploading?: boolean
  isExisting?: boolean // true if this is an existing file from storage
}

// Image compression function
const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          file.type,
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export default function EditMonthlyReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reportId = searchParams.get('id')
  const { account } = useAccountStore()
  const bhwAccount = account?.role === 'bhw' ? (account as unknown as BHW) : undefined
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [originalFileUrls, setOriginalFileUrls] = useState<string[]>([]) // Store original file URLs for comparison

  useEffect(() => {
    if (!account || account.role !== 'bhw') {
      router.push('/bhw/dashboard')
      return
    }

    if (!reportId) {
      errorToast('No report ID provided')
      router.push('/bhw/reports/monthly')
      return
    }

    fetchReport()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, router, reportId])

  const fetchReport = async () => {
    if (!reportId) return

    try {
      setIsLoading(true)
      const reportRef = doc(db, 'monthly-reports', reportId)
      const reportDoc = await getDoc(reportRef)

      if (!reportDoc.exists()) {
        errorToast('Report not found')
        router.push('/bhw/reports/monthly')
        return
      }

      const data = reportDoc.data()
      const reportData = {
        id: reportDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      } as MonthlyReport

      // Verify this report belongs to the logged-in BHW
      if (reportData.bhwId !== account?.id) {
        errorToast('You do not have permission to edit this report')
        router.push('/bhw/reports/monthly')
        return
      }

      setReport(reportData)

      // Load existing files
      if (reportData.contents && reportData.contents.length > 0) {
        // Store original file URLs for comparison when submitting
        setOriginalFileUrls([...reportData.contents])
        
        const existingFiles: FileWithPreview[] = reportData.contents.map((url) => {
          const fileType = url.toLowerCase().includes('.pdf') ? 'pdf' : 'image'
          return {
            file: null,
            preview: fileType === 'image' ? url : null,
            type: fileType,
            uploadUrl: url,
            isExisting: true
          }
        })
        setFiles(existingFiles)
      } else {
        setOriginalFileUrls([])
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      errorToast('Failed to load report')
      router.push('/bhw/reports/monthly')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    if (selectedFiles.length === 0) return

    const newFiles: FileWithPreview[] = []

    for (const file of selectedFiles) {
      // Validate file type
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'

      if (!isImage && !isPdf) {
        errorToast(`${file.name} is not a valid image or PDF file`)
        continue
      }

      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        errorToast(`${file.name} is too large. Maximum size is 10MB`)
        continue
      }

      let processedFile = file
      let preview: string | null = null

      // Compress images
      if (isImage) {
        try {
          processedFile = await compressImage(file)
          // Create preview
          const reader = new FileReader()
          reader.onload = (e) => {
            preview = e.target?.result as string
          }
          reader.readAsDataURL(processedFile)
          // Wait a bit for preview to be ready
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error('Error compressing image:', error)
          errorToast(`Failed to compress ${file.name}. Using original file.`)
        }
      }

      // Create preview for PDFs (just show icon)
      if (isPdf) {
        preview = null // PDFs don't have image previews
      }

      newFiles.push({
        file: processedFile,
        preview,
        type: isImage ? 'image' : 'pdf',
        isUploading: false,
        isExisting: false
      })
    }

    setFiles(prev => [...prev, ...newFiles])
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    // Just remove from UI - actual deletion from storage happens on submit
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Helper function to extract file path from Firebase Storage URL
  const extractFilePathFromUrl = (url: string): string | null => {
    try {
      if (url.includes('firebasestorage.googleapis.com')) {
        const urlObj = new URL(url)
        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/)
        if (pathMatch) {
          return decodeURIComponent(pathMatch[1])
        }
      } else {
        // If it's already a path, return as is
        return url
      }
    } catch (error) {
      console.error('Error extracting file path from URL:', error)
    }
    return null
  }

  // Helper function to delete a file from Firebase Storage
  const deleteFileFromStorage = async (fileUrl: string): Promise<void> => {
    const filePath = extractFilePathFromUrl(fileUrl)
    if (!filePath) {
      console.warn('Could not extract file path from URL:', fileUrl)
      return
    }

    try {
      const fileRef = ref(storage, filePath)
      await deleteObject(fileRef)
      console.log('Deleted file from storage:', filePath)
    } catch (error) {
      console.error('Error deleting file from storage:', fileUrl, error)
      // Continue even if deletion fails - don't block the update
    }
  }

  const uploadFile = async (fileWithPreview: FileWithPreview, bhwId: string, reportDate: string): Promise<string> => {
    if (!fileWithPreview.file) {
      throw new Error('No file to upload')
    }

    const timestamp = Date.now()
    const fileName = `monthly-reports/${bhwId}/${reportDate}/${timestamp}_${fileWithPreview.file.name}`
    const storageRef = ref(storage, fileName)

    await uploadBytes(storageRef, fileWithPreview.file)
    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bhwAccount || !account?.id || !report) {
      errorToast('Account information not found')
      return
    }

    if (files.length === 0) {
      errorToast('Please add at least one file (image or PDF)')
      return
    }

    setIsSubmitting(true)

    try {
      // Separate existing files and new files
      const existingFileUrls: string[] = []
      const newFilesToUpload: FileWithPreview[] = []
      
      files.forEach((fileWithPreview) => {
        if (fileWithPreview.isExisting && fileWithPreview.uploadUrl) {
          existingFileUrls.push(fileWithPreview.uploadUrl)
        } else if (!fileWithPreview.isExisting && fileWithPreview.file) {
          newFilesToUpload.push(fileWithPreview)
        }
      })

      // Upload new files
      const uploadPromises = newFilesToUpload.map(async (fileWithPreview) => {
        // Find the actual index in the files array
        const actualIndex = files.findIndex(f => f === fileWithPreview)
        
        // Update file state to show uploading
        setFiles(prev => prev.map((f, i) => 
          i === actualIndex ? { ...f, isUploading: true } : f
        ))

        try {
          const url = await uploadFile(fileWithPreview, account.id, report.reportDate)
          
          // Update file state with upload URL
          setFiles(prev => prev.map((f, i) => 
            i === actualIndex ? { ...f, uploadUrl: url, isUploading: false, isExisting: true } : f
          ))

          return url
        } catch (error) {
          console.error('Error uploading file:', error)
          setFiles(prev => prev.map((f, i) => 
            i === actualIndex ? { ...f, isUploading: false } : f
          ))
          throw error
        }
      })

      const newFileUrls = await Promise.all(uploadPromises)
      const allFileUrls = [...existingFileUrls, ...newFileUrls]

      // Find files that were in the original but are no longer in the final list
      const filesToDelete = originalFileUrls.filter(
        originalUrl => !allFileUrls.includes(originalUrl)
      )

      // Delete removed files from Firebase Storage
      if (filesToDelete.length > 0) {
        const deletePromises = filesToDelete.map(fileUrl => deleteFileFromStorage(fileUrl))
        await Promise.all(deletePromises)
        console.log(`Deleted ${filesToDelete.length} old file(s) from storage`)
      }

      // Update the report
      await updateDoc(doc(db, 'monthly-reports', report.id), {
        contents: allFileUrls as [string],
        updatedAt: new Date().toISOString()
      })

      successToast('Monthly report updated successfully!')
      
      // Navigate back after a delay
      setTimeout(() => {
        router.push('/bhw/reports/monthly')
      }, 1500)
    } catch (error) {
      console.error('Error updating report:', error)
      errorToast('Failed to update report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !bhwAccount) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Report not found</p>
              <button
                onClick={() => router.push('/bhw/reports/monthly')}
                className="btn btn-secondary"
              >
                Back to Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/bhw/reports/monthly')}
          className="btn btn-ghost btn-sm"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-secondary">Edit Monthly Report</h1>
      </div>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Report Month:</span>{' '}
              {format(parseISO(report.reportDate), 'MMMM yyyy')}
            </div>
            <div>
              <span className="font-semibold">Submitted:</span>{' '}
              {format(parseISO(report.createdAt), 'MMM d, yyyy h:mm a')}
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Upload Additional Files</span>
              </label>
              <div className="border-2 border-dashed border-base-300 rounded-lg p-6 text-center hover:border-secondary transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline btn-secondary"
                  disabled={isSubmitting}
                >
                  <FaUpload className="mr-2" />
                  Add More Images or PDFs
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: JPG, PNG, GIF, PDF (Max 10MB per file)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Images will be automatically compressed
                </p>
              </div>
            </div>

            {/* File Preview List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <label className="label">
                  <span className="label-text font-semibold">Files ({files.length})</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {files.map((fileWithPreview, index) => (
                    <div
                      key={index}
                      className="card bg-base-200 shadow-sm relative"
                    >
                      <div className="card-body p-4">
                        {fileWithPreview.isUploading && (
                          <div className="absolute inset-0 bg-base-100/80 flex items-center justify-center z-10 rounded-lg">
                            <span className="loading loading-spinner loading-md"></span>
                          </div>
                        )}
                        
                        {fileWithPreview.type === 'image' && fileWithPreview.preview ? (
                          <div className="aspect-video mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fileWithPreview.preview}
                              alt={fileWithPreview.file?.name || 'Existing file'}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video mb-2 bg-base-300 rounded flex items-center justify-center">
                            <FaFilePdf className="text-4xl text-error" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-2">
                          {fileWithPreview.type === 'image' ? (
                            <FaImage className="text-secondary" />
                          ) : (
                            <FaFilePdf className="text-error" />
                          )}
                          <span className="text-xs font-medium truncate flex-1">
                            {fileWithPreview.file?.name || fileWithPreview.uploadUrl?.split('/').pop() || `File ${index + 1}`}
                          </span>
                          {fileWithPreview.isExisting && (
                            <span className="badge badge-xs badge-info">Existing</span>
                          )}
                        </div>
                        
                        {fileWithPreview.file && (
                          <div className="text-xs text-gray-500 mb-2">
                            {(fileWithPreview.file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="btn btn-error btn-xs w-full"
                          disabled={isSubmitting || fileWithPreview.isUploading}
                        >
                          <FaTrash className="mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/bhw/reports/monthly')}
                className="btn btn-outline btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isSubmitting || files.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Updating...
                  </>
                ) : (
                  'Update Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
