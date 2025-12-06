'use client'

import React, { useState } from 'react'
import { HiPaperClip, HiTrash, HiX } from 'react-icons/hi'
import { collection, addDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import type { Message } from '@/interface/data'
import type { Account } from '@/interface/user'

interface Conversation {
  partnerId: string
  partnerName: string
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

interface ConversationModalProps {
  isOpen: boolean
  onClose: () => void
  conversation: Conversation | null
  account: Account | null
  onDeleteConversation: () => void
  isDeleting: boolean
  onDownloadAttachment: (url: string, filename: string) => void
  onReplySent?: () => void
}

// Helper function to get timestamp from Date or string
const getTimestamp = (date: Date | string | undefined): number => {
  if (!date) return 0
  if (date instanceof Date) return date.getTime()
  return new Date(date).getTime()
}

function ConversationModal({
  isOpen,
  onClose,
  conversation,
  account,
  onDeleteConversation,
  isDeleting,
  onDownloadAttachment,
  onReplySent
}: ConversationModalProps) {
  const [replyMessage, setReplyMessage] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  if (!isOpen || !conversation) return null

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

  // Send reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!replyMessage.trim() || !account || !conversation) {
      return
    }

    setIsSending(true)
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
        message: replyMessage.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        senderName: account.name || account.email,
        receiverName: conversation.partnerName,
        status: 'unread',
        attachment: attachmentUrl,
        senderId: account.id,
        receiverId: conversation.partnerId
      }

      // Save message to Firestore
      const messagesRef = collection(db, 'messages')
      await addDoc(messagesRef, messageData)

      // Reset form
      setReplyMessage('')
      setAttachment(null)
      setAttachmentPreview(null)

      // Notify parent to refresh messages
      if (onReplySent) {
        onReplySent()
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setIsSending(false)
      setIsUploading(false)
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-base-300">
          <h3 className="text-lg font-bold text-secondary">
            {conversation.partnerName}
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            ✕
          </button>
        </div>
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {conversation.messages
            .sort((a, b) => {
              const timeA = getTimestamp(a.createdAt)
              const timeB = getTimestamp(b.createdAt)
              return timeA - timeB
            })
            .map((message) => {
              const isSentByCurrentUser = message.senderId === account?.id
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isSentByCurrentUser
                        ? 'bg-secondary text-white'
                        : 'bg-base-200 text-gray-700'
                    }`}
                  >
                    {/* {!isSentByCurrentUser && (
                      <div className="text-xs font-semibold opacity-80">
                        {message.senderName}
                      </div>
                    )} */}
                    <div className="whitespace-pre-wrap text-xs">
                      {message.message}
                    </div>
                    {message.attachment && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <button
                          onClick={() => onDownloadAttachment(message.attachment, 'attachment')}
                          className="flex items-center gap-2 text-xs hover:opacity-80"
                        >
                          <HiPaperClip className="w-4 h-4" />
                          <span>Download Attachment</span>
                        </button>
                      </div>
                    )}
                    <div className={`text-xs mt-1 ${isSentByCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>
                      {typeof message.createdAt === 'string'
                        ? new Date(message.createdAt).toLocaleString()
                        : (message.createdAt as Date).toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Reply Form */}
        <div className="border-t border-base-300 pt-4">
          <form onSubmit={handleSendReply} className="space-y-3">
            <div className="form-control">
              <textarea
                className="textarea textarea-bordered text-xs w-full resize-none"
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={3}
                required
              />
            </div>

            {/* Attachment */}
            <div className="form-control">
              {!attachment ? (
                <div className="flex items-center gap-2">
                  <label className="btn btn-ghost btn-xs cursor-pointer">
                    <HiPaperClip className="w-4 h-4" />
                    <input
                      type="file"
                      onChange={handleAttachmentChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                  </label>
                  <span className="text-xs text-gray-500">Add attachment (optional)</span>
                </div>
              ) : (
                <div className="flex items-center justify-between border border-base-300 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    {attachmentPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachmentPreview}
                        alt="Preview"
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      <HiPaperClip className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium truncate max-w-xs">
                      {attachment.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="btn btn-ghost btn-xs"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={onDeleteConversation}
                className="btn btn-error btn-sm"
                disabled={isDeleting || isSending}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <HiTrash className="w-4 h-4 mr-1" />
                    Delete
                  </>
                )}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost btn-sm"
                  disabled={isSending}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!replyMessage.trim() || isSending || isUploading}
                >
                  {isSending ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      {isUploading ? 'Uploading...' : 'Sending...'}
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ConversationModal

