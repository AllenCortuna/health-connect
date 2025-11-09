'use client'

import React from 'react'
import type { Announcement } from '@/interface/data'
import { FaTimes, FaCalendarAlt, FaUser, FaClock, FaExclamationCircle } from 'react-icons/fa'

interface AnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  announcements: Announcement[]
}

function AnnouncementModal({ isOpen, onClose, date, announcements }: AnnouncementModalProps) {
  if (!isOpen || !date) return null

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

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-secondary" />
            <h3 className="font-bold text-lg text-secondary">Announcements for {formattedDate}</h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <FaTimes />
          </button>
        </div>

        <div className="divider"></div>

        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No announcements for this date</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-secondary">
                          {announcement.title}
                        </h4>
                        {announcement.important && (
                          <div className="badge badge-error badge-sm">
                            <FaExclamationCircle className="mr-1" />
                            Important
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FaUser className="text-xs" />
                      <span className="font-semibold">Created by:</span>
                      <span>{announcement.createdBy}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FaClock className="text-xs" />
                      <span className="font-semibold">Time:</span>
                      <span>{announcement.time || 'Not specified'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FaCalendarAlt className="text-xs" />
                      <span className="font-semibold">Created:</span>
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="text-xs text-gray-700 whitespace-pre-wrap">
                    {announcement.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-action">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementModal

