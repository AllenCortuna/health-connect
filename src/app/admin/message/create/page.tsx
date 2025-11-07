'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { useRouter } from 'next/navigation'
import { HiArrowLeft, HiPaperClip, HiX } from 'react-icons/hi'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import type { Message } from '@/interface/data'
import type { Account, Household } from '@/interface/user'

interface SearchResult {
  id: string
  fullName: string
  type: 'resident' | 'bhw'
  contactNumber?: string
  email?: string
}

const CreateMessage = () => {
  const router = useRouter()
  const { account } = useAccountStore()
  
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [messageType, setMessageType] = useState<'resident' | 'bhw'>('resident')
  
  // State for message composition
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Search for residents and BHWs
  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results: SearchResult[] = []

      if (messageType === 'resident') {
        // Search residents
        const residentsRef = collection(db, 'household')
        const residentsQuery = query(residentsRef, orderBy('headOfHousehold'))
        const residentsSnapshot = await getDocs(residentsQuery)
        
        residentsSnapshot.forEach((doc) => {
          const data = doc.data() as Household
          if (data.headOfHousehold.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({
              id: doc.id,
              fullName: data.headOfHousehold,
              type: 'resident',
              contactNumber: data.headOfHouseholdContactNumber,
              email: data.email
            })
          }
        })
      } else {
        // Search BHWs from accounts collection
        const accountsRef = collection(db, 'accounts')
        const accountsQuery = query(accountsRef, orderBy('name'))
        const accountsSnapshot = await getDocs(accountsQuery)
        
        accountsSnapshot.forEach((doc) => {
          const data = doc.data() as Account
          if (data.role === 'bhw' && data.name && data.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({
              id: doc.id,
              fullName: data.name,
              type: 'bhw',
              contactNumber: data.contactNumber,
              email: data.email
            })
          }
        })
      }

      setSearchResults(results)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }, [messageType])

  // Handle search input change and message type change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchUsers])

  // Clear search results when message type changes
  useEffect(() => {
    setSearchResults([])
    setSelectedRecipient(null)
    setSearchTerm('')
  }, [messageType])

  // Handle attachment selection
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttachment(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAttachmentPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setAttachmentPreview(null)
      }
    }
  }

  // Remove attachment
  const removeAttachment = () => {
    setAttachment(null)
    setAttachmentPreview(null)
  }

  // Upload attachment to Firebase Storage
  const uploadAttachment = async (file: File): Promise<string> => {
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const storageRef = ref(storage, `message-attachments/${fileName}`)
    
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return downloadURL
  }

  // Submit message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRecipient || !message.trim() || !account) {
      return
    }

    setIsSubmitting(true)
    try {
      let attachmentUrl = ''
      
      // Upload attachment if present
      if (attachment) {
        setIsUploading(true)
        attachmentUrl = await uploadAttachment(attachment)
        setIsUploading(false)
      }

      // Create message object
      const messageData: Omit<Message, 'id'> = {
        message: message.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        senderName: account.name || account.email,
        receiverName: selectedRecipient.fullName,
        status: 'unread',
        attachment: attachmentUrl,
        senderId: account.id,
        receiverId: selectedRecipient.id
      }

      // Save message to Firestore
      const messagesRef = collection(db, 'messages')
      await addDoc(messagesRef, messageData)

      // Reset form
      setMessage('')
      setSelectedRecipient(null)
      setAttachment(null)
      setAttachmentPreview(null)
      setSearchTerm('')
      setSearchResults([])

      // Navigate back to messages list
      router.push('/admin/message')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-1 mb-6">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-circle"
        >
          <HiArrowLeft className="w-5 h-5 text-secondary" />
        </button>
        <h1 className="text-xl font-bold text-secondary">Compose Message</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Search */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-sm font-semibold text-secondary mb-4">Select Recipient</h2>
            
            {/* Message Type Selection */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-xs text-secondary">Message Type</span>
              </label>
              <div className="flex gap-4">
                <label className="label cursor-pointer">
                  <input
                    type="radio"
                    name="messageType"
                    value="resident"
                    checked={messageType === 'resident'}
                    onChange={(e) => setMessageType(e.target.value as 'resident' | 'bhw')}
                    className="radio radio-xs radio-primary text-secondary"
                  />
                  <span className="label-text ml-2">Resident</span>
                </label>
                <label className="label cursor-pointer">
                  <input
                    type="radio"
                    name="messageType"
                    value="bhw"
                    checked={messageType === 'bhw'}
                    onChange={(e) => setMessageType(e.target.value as 'resident' | 'bhw')}
                    className="radio radio-xs radio-primary text-secondary"
                  />
                  <span className="label-text ml-2">BHW</span>
                </label>
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Search {messageType === 'resident' ? 'Resident' : 'BHW'}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type full name to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-bordered w-full pr-10"
                />
                <HiMagnifyingGlass className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <div className="max-h-60 overflow-y-auto border border-base-300 rounded-lg">
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={`p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0 ${
                        selectedRecipient?.id === result.id && selectedRecipient?.type === result.type
                          ? 'bg-primary text-primary-content'
                          : ''
                      }`}
                      onClick={() => setSelectedRecipient(result)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{result.fullName}</div>
                          <div className="text-sm opacity-70">
                            {result.type === 'resident' ? 'Resident' : 'BHW'}
                            {result.contactNumber && ` • ${result.contactNumber}`}
                          </div>
                        </div>
                        <div className="badge badge-outline">
                          {result.type === 'resident' ? 'Resident' : 'BHW'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Recipient */}
            {selectedRecipient && (
              <div className="mt-4 p-3 bg-primary text-primary-content rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">To: {selectedRecipient.fullName}</div>
                    <div className="text-sm opacity-80">
                      {selectedRecipient.type === 'resident' ? 'Resident' : 'BHW'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRecipient(null)}
                    className="btn btn-ghost btn-sm"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {isSearching && (
              <div className="flex justify-center mt-4">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            )}
          </div>
        </div>

        {/* Message Composition */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg font-semibold text-secondary mb-4">Compose Message</h2>
            
            <div className="form-control flex flex-col gap-2">
              <label className="label">
                <span className="label-text font-semibold">Message</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32 resize-none text-xs  w-full"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {/* Attachment */}
            <div className="form-control mt-5">
              <label className="label">
                <span className="label-text font-semibold">Attachment (Optional)</span>
              </label>
              
              {!attachment ? (
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    onChange={handleAttachmentChange}
                    className="file-input file-input-bordered w-full max-w-xs"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <div className="text-sm text-gray-500">
                    Supported: Images, PDF, DOC, TXT
                  </div>
                </div>
              ) : (
                <div className="border border-base-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {attachmentPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={attachmentPreview}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-base-200 rounded flex items-center justify-center">
                          <HiPaperClip className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{attachment.name}</div>
                        <div className="text-sm text-gray-500">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="btn btn-ghost btn-sm"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-outline"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!selectedRecipient || !message.trim() || isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {isUploading ? 'Uploading...' : 'Sending...'}
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateMessage
