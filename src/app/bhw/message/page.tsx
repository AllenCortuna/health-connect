'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { useRouter } from 'next/navigation'
import { HiPlus, HiPaperClip, HiDownload, HiTrash } from 'react-icons/hi'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import type { Message } from '@/interface/data'

const Messages = () => {
  const router = useRouter()
  const { account } = useAccountStore()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const messagesRef = collection(db, 'messages')
      const q = query(messagesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const messagesData: Message[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const message = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as Message
        
        messagesData.push(message)
      })
      
      setMessages(messagesData)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter messages based on search and tab
  const filteredMessages = messages.filter((message) => {
    const matchesSearch = searchTerm === '' || 
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filter by inbox/sent based on current user
    const isSentByCurrentUser = message.senderId === account?.id
    const matchesTab = activeTab === 'sent' ? isSentByCurrentUser : !isSentByCurrentUser
    
    return matchesSearch && matchesTab
  })

  // Open message modal and mark as read if it's unread
  const openMessageModal = async (message: Message) => {
    setSelectedMessage(message)
    setIsModalOpen(true)
    
    // Mark as read if it's unread and in inbox
    if (activeTab === 'inbox' && message.status === 'unread' && message.receiverId === account?.id) {
      await markAsRead(message.id)
    }
  }

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId)
      await updateDoc(messageRef, {
        status: 'read'
      })
      
      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, status: 'read' as const } : msg
        )
      )
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  // Mark all unread messages as read
  const markAllAsRead = async () => {
    const unreadMessages = messages.filter(msg => 
      msg.status === 'unread' && 
      msg.receiverId === account?.id
    )
    
    try {
      const updatePromises = unreadMessages.map(msg => 
        updateDoc(doc(db, 'messages', msg.id), { status: 'read' })
      )
      
      await Promise.all(updatePromises)
      
      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.status === 'unread' && msg.receiverId === account?.id 
            ? { ...msg, status: 'read' as const } 
            : msg
        )
      )
    } catch (error) {
      console.error('Error marking all messages as read:', error)
    }
  }

  // Close message modal
  const closeMessageModal = () => {
    setSelectedMessage(null)
    setIsModalOpen(false)
  }

  // Download attachment
  const downloadAttachment = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Delete message and its attachment
  const deleteMessage = async (messageId: string, attachmentUrl?: string) => {
    setIsDeleting(true)
    try {
      // Delete attachment from Firebase Storage if it exists
      if (attachmentUrl) {
        try {
          const attachmentRef = ref(storage, attachmentUrl)
          await deleteObject(attachmentRef)
        } catch (error) {
          console.error('Error deleting attachment:', error)
          // Continue with message deletion even if attachment deletion fails
        }
      }

      // Delete message from Firestore
      const messageRef = doc(db, 'messages', messageId)
      await deleteDoc(messageRef)

      // Update local state
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== messageId)
      )

      // Close modal if the deleted message was selected
      if (selectedMessage?.id === messageId) {
        closeMessageModal()
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    } finally {
      setIsDeleting(false)
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary">Messages</h1>
        <button
          onClick={() => router.push('/bhw/message/create')}
          className="btn btn-primary"
        >
          <HiPlus className="mr-2" />
          New Message
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pr-10"
          />
          <HiMagnifyingGlass className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Gmail-like Interface */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          {/* Tabs */}
          <div className="flex items-center justify-between p-4">
            <div className="flex">
              <button
                className={`btn btn-sm ${activeTab === 'inbox' ? 'btn-secondary text-white' : 'btn-outline text-secondary'}`}
                onClick={() => setActiveTab('inbox')}
              >
                Inbox ({messages.filter(m => m.receiverId === account?.id).length})
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'sent' ? 'btn-secondary text-white' : 'btn-outline text-secondary'}`}
                onClick={() => setActiveTab('sent')}
              >
                Sent ({messages.filter(m => m.senderId === account?.id).length})
              </button>
            </div>
            
            {/* Mark All as Read button for inbox */}
            {activeTab === 'inbox' && messages.filter(m => m.receiverId === account?.id && m.status === 'unread').length > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn btn-outline btn-sm"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {/* Message List */}
          <div className="px-4 pb-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                {messages.length === 0 ? (
                  <>
                    <p className="text-gray-500 mb-4">No messages found</p>
                    <button
                      onClick={() => router.push('/bhw/message/create')}
                      className="btn btn-secondary"
                    >
                      <HiPlus className="mr-2" />
                      Send First Message
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">No messages in {activeTab}</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="btn btn-outline btn-secondary"
                    >
                      Clear Search
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMessages.map((message) => {
                  const isUnread = activeTab === 'inbox' && message.status === 'unread'
                  const isSentByCurrentUser = message.senderId === account?.id
                  
                  return (
                    <div
                      key={message.id}
                      className={`p-4 border border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors ${
                        isUnread ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => openMessageModal(message)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`font-semibold ${isUnread ? 'text-secondary' : 'text-gray-500'}`}>
                              {isSentByCurrentUser ? message.receiverName : message.senderName}
                            </div>
                            {message.attachment && (
                              <HiPaperClip className="w-4 h-4 text-gray-400" />
                            )}
                            {isUnread && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {message.message}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 ml-4">
                          {message.createdAt ? message.createdAt.toLocaleString() : message.createdAt}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message View Modal */}
      {isModalOpen && selectedMessage && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">Message</h3>
              <button
                onClick={closeMessageModal}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Message Header */}
              <div className="border-b border-base-300 pb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">From:</span> {selectedMessage.senderName}
                  </div>
                  <div>
                    <span className="font-semibold">To:</span> {selectedMessage.receiverName}
                  </div>
                  <div>
                    <span className="font-semibold">Date:</span> {
                      selectedMessage.createdAt
                        ? selectedMessage.createdAt.toLocaleString()
                        : selectedMessage.createdAt
                    }
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>
                    <span className={`badge badge-sm ml-2 ${
                      selectedMessage.status === 'read' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {selectedMessage.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap bg-base-200 p-4 rounded-lg">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Attachment */}
              {selectedMessage.attachment && (
                <div className="border-t border-base-300 pt-4">
                  <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <HiPaperClip className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium">Attachment</div>
                        <div className="text-sm text-gray-500">
                          Click to download
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadAttachment(selectedMessage.attachment, 'attachment')}
                      className="btn btn-sm btn-outline"
                    >
                      <HiDownload className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              {activeTab === 'inbox' && selectedMessage.status === 'unread' && selectedMessage.receiverId === account?.id && (
                <button 
                  onClick={() => markAsRead(selectedMessage.id)} 
                  className="btn btn-outline btn-xs text-secondary"
                >
                  Mark as Read
                </button>
              )}
              {activeTab === 'inbox' && selectedMessage.receiverId === account?.id && (
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
                      deleteMessage(selectedMessage.id, selectedMessage.attachment)
                    }
                  }}
                  className="btn btn-error btn-xs text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <HiTrash className="w-3 h-3 mr-1" />
                      Delete
                    </>
                  )}
                </button>
              )}
              <button onClick={closeMessageModal} className="btn btn-secondary btn-xs text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages
