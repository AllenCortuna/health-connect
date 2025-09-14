'use client'

import React, { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Announcement } from '@/interface/data'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaArrowLeft, FaEdit, FaExclamationCircle, FaCalendarAlt, FaUser } from 'react-icons/fa'
import Link from 'next/link'
import { errorToast } from '@/lib/toast'

const ViewAnnouncement = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const announcementId = searchParams.get('id')
  
  const [isLoading, setIsLoading] = useState(true)
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    if (announcementId) {
      fetchAnnouncement()
    } else {
      errorToast('Announcement ID is required')
      router.push('/bhw/announcement')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementId])

  const fetchAnnouncement = async () => {
    try {
      setIsLoading(true)
      const announcementRef = doc(db, 'announcements', announcementId!)
      const announcementSnap = await getDoc(announcementRef)
      
      if (announcementSnap.exists()) {
        const data = announcementSnap.data()
        const announcementData: Announcement = {
          id: announcementSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Announcement
        
        setAnnouncement(announcementData)
      } else {
        errorToast('Announcement not found')
        router.push('/bhw/announcement')
      }
    } catch (error) {
      console.error('Error fetching announcement:', error)
      errorToast('Failed to fetch announcement data')
      router.push('/bhw/announcement')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const formatDisplayDate = (dateString: string, timeString: string) => {
    try {
      const date = new Date(`${dateString}T${timeString}`)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
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

  if (!announcement) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-error">Announcement not found</p>
          <button
            onClick={() => router.push('/bhw/announcement')}
            className="btn btn-secondary mt-4"
          >
            Back to Announcements
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/bhw/announcement')}
            className="btn btn-ghost btn-sm"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-secondary">Announcement Details</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            href={`/bhw/announcement/edit?id=${announcement.id}`}
            className="btn btn-outline btn-secondary btn-sm"
            title="Edit Announcement"
          >
            <FaEdit className="mr-1" />
            Edit
          </Link>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-secondary">
                  {announcement.title}
                </h2>
                {announcement.important && (
                  <div className="badge badge-error badge-lg">
                    <FaExclamationCircle className="mr-1" />
                    Important
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FaUser />
                  <span>Created by: <span className="font-medium">{announcement.createdBy}</span></span>
                </div>
                <div className="flex items-center gap-1">
                  <FaCalendarAlt />
                  <span>Scheduled: <span className="font-medium">{formatDisplayDate(announcement.date, announcement.time)}</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="card bg-base-200 mb-6">
            <div className="card-body p-6">
              <h3 className="text-lg font-semibold text-secondary mb-3">Content</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {announcement.content}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h3 className="text-lg font-semibold text-secondary mb-3">Announcement Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-600">Created At:</span>
                  <p className="text-gray-700">{formatDate(announcement.createdAt)}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Last Updated:</span>
                  <p className="text-gray-700">{formatDate(announcement.updatedAt)}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Scheduled Date:</span>
                  <p className="text-gray-700">{announcement.date}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Scheduled Time:</span>
                  <p className="text-gray-700">{announcement.time}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Importance Level:</span>
                  <p className="text-gray-700">
                    {announcement.important ? (
                      <span className="badge badge-error badge-sm">Important</span>
                    ) : (
                      <span className="badge badge-ghost badge-sm">Normal</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => router.push('/bhw/announcement')}
              className="btn btn-outline btn-secondary"
            >
              Back to Announcements
            </button>
            <Link
              href={`/bhw/announcement/edit?id=${announcement.id}`}
              className="btn btn-secondary"
            >
              <FaEdit className="mr-2" />
              Edit Announcement
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewAnnouncement
