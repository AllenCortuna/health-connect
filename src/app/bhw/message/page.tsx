'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { useRouter } from 'next/navigation'
import { HiPlus, HiPaperClip } from 'react-icons/hi'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import type { Message } from '@/interface/data'
import ConversationModal from '@/components/bhw/ConversationModal'

interface Conversation {
  partnerId: string
  partnerName: string
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

// Helper function to get timestamp from Date or string
const getTimestamp = (date: Date | string | undefined): number => {
  if (!date) return 0
  if (date instanceof Date) return date.getTime()
  return new Date(date).getTime()
}

const Messages = () => {
  const router = useRouter()
  const { account } = useAccountStore()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update selected conversation when messages change
  useEffect(() => {
    if (selectedConversation && conversations.length > 0) {
      const updatedConversation = conversations.find(
        conv => conv.partnerId === selectedConversation.partnerId
      )
      if (updatedConversation) {
        setSelectedConversation(updatedConversation)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, selectedConversation?.partnerId])

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

      // If we have a logged-in BHW, keep only messages where they are sender or receiver
      const filteredMessages = account?.id
        ? messagesData.filter(
            msg => msg.senderId === account.id || msg.receiverId === account.id
          )
        : messagesData

      setMessages(filteredMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Group messages by conversation partner
  const conversations = useMemo(() => {
    if (!account?.id) return []

    const conversationMap = new Map<string, Conversation>()

    messages.forEach((message) => {
      // Determine the conversation partner
      const isSentByCurrentUser = message.senderId === account.id
      const partnerId = isSentByCurrentUser ? message.receiverId : message.senderId
      const partnerName = isSentByCurrentUser ? message.receiverName : message.senderName

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: message,
          unreadCount: 0,
          messages: []
        })
      }

      const conversation = conversationMap.get(partnerId)!
      conversation.messages.push(message)

      // Update last message if this one is newer
      if (message.createdAt && conversation.lastMessage.createdAt) {
        const messageTime = getTimestamp(message.createdAt)
        const lastMessageTime = getTimestamp(conversation.lastMessage.createdAt)
        
        if (messageTime > lastMessageTime) {
          conversation.lastMessage = message
        }
      }

      // Count unread messages (only messages received by current user)
      if (!isSentByCurrentUser && message.status === 'unread' && message.receiverId === account.id) {
        conversation.unreadCount++
      }
    })

    // Sort conversations by last message time (newest first)
    return Array.from(conversationMap.values()).sort((a, b) => {
      const timeA = getTimestamp(a.lastMessage.createdAt)
      const timeB = getTimestamp(b.lastMessage.createdAt)
      return timeB - timeA
    })
  }, [messages, account?.id])

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (searchTerm === '') return conversations
    
    const searchLower = searchTerm.toLowerCase()
    return conversations.filter(conv => 
      conv.partnerName.toLowerCase().includes(searchLower) ||
      conv.lastMessage.message.toLowerCase().includes(searchLower)
    )
  }, [conversations, searchTerm])

  // Open conversation modal
  const openConversationModal = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setIsModalOpen(true)
    
    // Mark all unread messages in this conversation as read
    const unreadMessages = conversation.messages.filter(
      msg => msg.status === 'unread' && msg.receiverId === account?.id
    )
    
    if (unreadMessages.length > 0) {
      const updatePromises = unreadMessages.map(msg => markAsRead(msg.id))
      await Promise.all(updatePromises)
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

  // Close conversation modal
  const closeConversationModal = () => {
    setSelectedConversation(null)
    setIsModalOpen(false)
    // Refresh messages to update unread counts
    fetchMessages()
  }

  // Handle reply sent - refresh messages
  const handleReplySent = async () => {
    // Refresh all messages - the useEffect will automatically update the selected conversation
    await fetchMessages()
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

      // Refresh conversation if modal is open
      if (isModalOpen && selectedConversation) {
        const updatedMessages = messages.filter(msg => msg.id !== messageId)
        const conversationMessages = updatedMessages.filter(msg => {
          const isSentByCurrentUser = msg.senderId === account?.id
          const partnerId = isSentByCurrentUser ? msg.receiverId : msg.senderId
          return partnerId === selectedConversation.partnerId
        })
        
        if (conversationMessages.length === 0) {
          closeConversationModal()
        } else {
          setSelectedConversation({
            ...selectedConversation,
            messages: conversationMessages.sort((a, b) => {
              const timeA = getTimestamp(a.createdAt)
              const timeB = getTimestamp(b.createdAt)
              return timeA - timeB
            })
          })
        }
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

      {/* Facebook Messenger-like Interface */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          {/* Conversation List */}
          <div className="px-4 pb-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                {conversations.length === 0 ? (
                  <>
                    <p className="text-gray-500 mb-4">No conversations found</p>
                    <button
                      onClick={() => router.push('/bhw/message/create')}
                      className="btn btn-secondary"
                    >
                      <HiPlus className="mr-2" />
                      Start New Conversation
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">No conversations match your search</p>
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
                {filteredConversations.map((conversation) => {
                  const lastMessage = conversation.lastMessage
                  const isUnread = conversation.unreadCount > 0
                  const isSentByCurrentUser = lastMessage.senderId === account?.id
                  
                  return (
                    <div
                      key={conversation.partnerId}
                      className={`p-4 border border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors ${
                        isUnread ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => openConversationModal(conversation)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`font-semibold text-sm ${isUnread ? 'text-secondary' : 'text-gray-600'}`}>
                              {conversation.partnerName}
                            </div>
                            {lastMessage.attachment && (
                              <HiPaperClip className="w-4 h-4 text-gray-400" />
                            )}
                            {isUnread && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                            {isUnread && conversation.unreadCount > 1 && (
                              <span className="badge badge-primary badge-sm">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {isSentByCurrentUser && <span className="text-gray-400 text-xs">You: </span>}
                            {lastMessage.message}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 ml-4 flex flex-col items-end">
                          {lastMessage.createdAt && (
                            <span>
                              {typeof lastMessage.createdAt === 'string'
                                ? new Date(lastMessage.createdAt).toLocaleString()
                                : (lastMessage.createdAt as Date).toLocaleString()}
                            </span>
                          )}
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

      {/* Conversation View Modal */}
      <ConversationModal
        isOpen={isModalOpen}
        onClose={closeConversationModal}
        conversation={selectedConversation}
        account={account}
        onDeleteConversation={() => {
          if (selectedConversation && confirm('Are you sure you want to delete this conversation? All messages will be permanently deleted.')) {
            const deletePromises = selectedConversation.messages.map(msg =>
              deleteMessage(msg.id, msg.attachment)
            )
            Promise.all(deletePromises).then(() => {
              closeConversationModal()
            })
          }
        }}
        isDeleting={isDeleting}
        onDownloadAttachment={downloadAttachment}
        onReplySent={handleReplySent}
      />
    </div>
  )
}

export default Messages
