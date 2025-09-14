'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Announcement } from '@/interface/data'
import { useRouter } from 'next/navigation'
import { FaPlus, FaTrash, FaEye, FaEdit, FaExclamationCircle } from 'react-icons/fa'
import Link from 'next/link'
import { successToast, errorToast } from '@/lib/toast'
const AnnouncementPage = () => {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [importanceFilter, setImportanceFilter] = useState<string>('all')
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const announcementsRef = collection(db, 'announcements')
      const q = query(announcementsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const announcementsData: Announcement[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const announcement = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Announcement
        
        announcementsData.push(announcement)
      })
      
      setAnnouncements(announcementsData)
    } catch (error) {
      console.error('Error fetching announcements:', error)
      errorToast('Failed to fetch announcements')
    } finally {
      setIsLoading(false)
    }
  }

  const openDeleteModal = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setAnnouncementToDelete(null)
  }

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return

    setIsDeleting(true)
    try {
      const announcementRef = doc(db, 'announcements', announcementToDelete.id)
      await deleteDoc(announcementRef)
      
      successToast('Announcement deleted successfully!')
      closeDeleteModal()
      fetchAnnouncements() // Refresh the list
    } catch (error) {
      console.error('Error deleting announcement:', error)
      errorToast('Failed to delete announcement. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter and search announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch = searchTerm === '' || 
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesImportance = importanceFilter === 'all' || 
      (importanceFilter === 'important' && announcement.important) ||
      (importanceFilter === 'normal' && !announcement.important)
    
    return matchesSearch && matchesImportance
  })

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary">Announcements</h1>
        <button
          onClick={() => router.push('/bhw/announcement/create')}
          className="btn btn-secondary btn-sm"
        >
          <FaPlus className="mr-2" />
          Create Announcement
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Search</span>
              </label>
              <input
                type="text"
                placeholder="Search by title, content, or creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>

            {/* Importance Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Importance</span>
              </label>
              <select
                value={importanceFilter}
                onChange={(e) => setImportanceFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Announcements</option>
                <option value="important">Important Only</option>
                <option value="normal">Normal Only</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Results</span>
              </label>
              <div className="input input-bordered input-sm bg-base-200 flex items-center">
                <span className="text-sm">
                  {filteredAnnouncements.length} of {announcements.length} announcements
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8">
              {announcements.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-4">No announcements found</p>
                  <button
                    onClick={() => router.push('/bhw/announcement/create')}
                    className="btn btn-secondary"
                  >
                    <FaPlus className="mr-2" />
                    Create First Announcement
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">No announcements match your search criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setImportanceFilter('all')
                    }}
                    className="btn btn-outline btn-secondary"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <div key={announcement.id} className="card bg-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="drop-shadow font-bold text-secondary">
                            {announcement.title}
                          </h3>
                          {announcement.important && (
                            <div className="badge badge-error badge-xs text-[10px] font-bold">
                              Important
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          Created by <span className="font-bold">{announcement.createdBy}</span>
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {formatDate(announcement.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/bhw/announcement/view?id=${announcement.id}`)}
                          className="btn btn-outline btn-secondary btn-xs"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <Link
                          href={`/bhw/announcement/edit?id=${announcement.id}`}
                          className="btn btn-outline btn-secondary btn-xs"
                          title="Edit Announcement"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(announcement)}
                          className="btn btn-outline btn-error btn-xs"
                          title="Delete Announcement"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      <p className="line-clamp-3">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && announcementToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationCircle className="text-error text-xl" />
              <h3 className="font-bold text-lg">Confirm Delete</h3>
            </div>
            
            <div className="py-4">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this announcement?
              </p>
              
              <div className="bg-base-200 p-4 rounded-lg mb-4">
                <div className="text-sm">
                  <div className="mb-2">
                    <span className="font-semibold">Title:</span>
                    <p className="text-gray-700">{announcementToDelete.title}</p>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Created by:</span>
                    <p className="text-gray-700">{announcementToDelete.createdBy}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Importance:</span>
                    <p className="text-gray-700">
                      {announcementToDelete.important ? 'Important' : 'Normal'}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-error text-sm font-medium">
                ⚠️ This action cannot be undone. The announcement will be permanently deleted.
              </p>
            </div>

            <div className="modal-action">
              <button
                onClick={closeDeleteModal}
                className="btn btn-outline btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAnnouncement}
                className="btn btn-error"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete Announcement'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnnouncementPage
