'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { useRouter } from 'next/navigation'
import { successToast, errorToast } from '@/lib/toast'
import type { MonthlyReport } from '@/interface/data'
import type { BHW } from '@/interface/user'
import { FaArrowLeft, FaTrash, FaFilePdf, FaImage, FaUpload } from 'react-icons/fa'
import { format, parseISO } from 'date-fns'

interface FileWithPreview {
  file: File
  preview: string | null
  type: 'image' | 'pdf'
  uploadUrl?: string
  isUploading?: boolean
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

export default function MonthlyReportsPage() {
  const router = useRouter()
  const { account } = useAccountStore()
  const bhwAccount = account?.role === 'bhw' ? (account as unknown as BHW) : undefined
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM'))
  const [existingReport, setExistingReport] = useState<MonthlyReport | null>(null)
  const [isCheckingReport, setIsCheckingReport] = useState(false)

  useEffect(() => {
    if (!account || account.role !== 'bhw') {
      router.push('/bhw/dashboard')
    }
  }, [account, router])

  const checkExistingReport = useCallback(async () => {
    if (!account?.id || !reportDate) return

    try {
      setIsCheckingReport(true)
      const reportsRef = collection(db, 'monthly-reports')
      const monthStart = `${reportDate}-01`
      const q = query(
        reportsRef,
        where('bhwId', '==', account.id),
        where('reportDate', '==', monthStart)
      )
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        const data = doc.data()
        setExistingReport({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as MonthlyReport)
      } else {
        setExistingReport(null)
      }
    } catch (error) {
      console.error('Error checking existing report:', error)
      setExistingReport(null)
    } finally {
      setIsCheckingReport(false)
    }
  }, [account?.id, reportDate])

  // Check for existing report when month changes
  useEffect(() => {
    if (account?.id && reportDate) {
      checkExistingReport()
    }
  }, [reportDate, account?.id, checkExistingReport])

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
        isUploading: false
      })
    }

    setFiles(prev => [...prev, ...newFiles])
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFile = async (fileWithPreview: FileWithPreview, bhwId: string, reportDate: string): Promise<string> => {
    const timestamp = Date.now()
    const fileName = `monthly-reports/${bhwId}/${reportDate}/${timestamp}_${fileWithPreview.file.name}`
    const storageRef = ref(storage, fileName)

    await uploadBytes(storageRef, fileWithPreview.file)
    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bhwAccount || !account?.id) {
      errorToast('Account information not found')
      return
    }

    if (files.length === 0) {
      errorToast('Please add at least one file (image or PDF)')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload all files
      const uploadPromises = files.map(async (fileWithPreview, index) => {
        // Update file state to show uploading
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, isUploading: true } : f
        ))

        try {
          const url = await uploadFile(fileWithPreview, account.id, reportDate)
          
          // Update file state with upload URL
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, uploadUrl: url, isUploading: false } : f
          ))

          return url
        } catch (error) {
          console.error('Error uploading file:', error)
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, isUploading: false } : f
          ))
          throw error
        }
      })

      const uploadedUrls = await Promise.all(uploadPromises)

      // Check if report already exists for this month
      const reportsRef = collection(db, 'monthly-reports')
      const monthStart = `${reportDate}-01`
      const q = query(
        reportsRef,
        where('bhwId', '==', account.id),
        where('reportDate', '==', monthStart)
      )
      const querySnapshot = await getDocs(q)

      const reportData: Omit<MonthlyReport, 'id'> = {
        bhwId: account.id,
        bhwName: bhwAccount.name || bhwAccount.email || 'Unknown',
        reportDate: monthStart,
        reportType: 'monthly',
        contents: uploadedUrls as [string],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        barangay: bhwAccount.barangay || ''
      }

      if (!querySnapshot.empty) {
        // Update existing report - delete old files first
        const existingReportDoc = querySnapshot.docs[0]
        const existingReportData = existingReportDoc.data() as MonthlyReport
        
        // Delete old files from Firebase Storage
        if (existingReportData.contents && existingReportData.contents.length > 0) {
          const deletePromises = existingReportData.contents.map(async (fileUrl) => {
            try {
              // Extract the file path from Firebase Storage URL
              // Firebase Storage URLs format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
              let filePath = ''
              
              if (fileUrl.includes('firebasestorage.googleapis.com')) {
                // Full Firebase Storage URL
                const urlObj = new URL(fileUrl)
                // Match pattern: /o/{path}? or /o/{path}%2F{filename}?
                const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/)
                if (pathMatch) {
                  filePath = decodeURIComponent(pathMatch[1])
                }
              } else {
                // If it's already a storage path (not a full URL), use it directly
                filePath = fileUrl
              }
              
              if (filePath) {
                const fileRef = ref(storage, filePath)
                await deleteObject(fileRef)
                console.log('Deleted old file:', filePath)
              } else {
                console.warn('Could not extract file path from URL:', fileUrl)
              }
            } catch (error) {
              console.error('Error deleting old file:', fileUrl, error)
              // Continue even if deletion fails - don't block the update
            }
          })
          
          await Promise.all(deletePromises)
        }
        
        // Update the report with new files
        await updateDoc(doc(db, 'monthly-reports', existingReportDoc.id), {
          ...reportData,
          updatedAt: new Date().toISOString()
        })
        successToast('Monthly report updated successfully!')
      } else {
        // Create new report
        await addDoc(collection(db, 'monthly-reports'), {
          ...reportData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        successToast('Monthly report submitted successfully!')
      }

      // Reset form
      setFiles([])
      setReportDate(format(new Date(), 'yyyy-MM'))
      setExistingReport(null)
      
      // Navigate back after a delay
      setTimeout(() => {
        router.push('/bhw/reports/monthly')
      }, 1500)
    } catch (error) {
      console.error('Error submitting report:', error)
      errorToast('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!bhwAccount) {
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
          onClick={() => router.push('/bhw/reports')}
          className="btn btn-ghost btn-sm"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-secondary">Monthly Report</h1>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Report Date Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Report Month *</span>
              </label>
              <input
                type="month"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="input input-bordered"
                max={format(new Date(), 'yyyy-MM')}
                required
                disabled={isSubmitting || isCheckingReport}
              />
              <span className="label-text-alt text-gray-500">
                Select the month for this report
              </span>
              {isCheckingReport && (
                <span className="label-text-alt text-gray-400">
                  Checking for existing report...
                </span>
              )}
            </div>

            {/* Existing Report Warning */}
            {existingReport && !isCheckingReport && (
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-bold">Report Already Exists</h3>
                  <div className="text-xs">
                    A monthly report already exists for {format(parseISO(existingReport.reportDate), 'MMMM yyyy')}. 
                    Submitting this form will update the existing report with new files.
                    {existingReport.contents && existingReport.contents.length > 0 && (
                      <span className="block mt-1">
                        Current report has {existingReport.contents.length} file{existingReport.contents.length !== 1 ? 's' : ''}.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* File Upload Section */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Upload Files *</span>
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
                  Select Images or PDFs
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
                  <span className="label-text font-semibold">Selected Files ({files.length})</span>
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
                              alt={fileWithPreview.file.name}
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
                            {fileWithPreview.file.name}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {(fileWithPreview.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="btn btn-error btn-xs w-full mt-2"
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
                onClick={() => router.push('/bhw/reports')}
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
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
