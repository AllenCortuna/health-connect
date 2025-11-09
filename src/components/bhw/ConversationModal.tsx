'use client'

import React from 'react'
import { HiPaperClip, HiTrash } from 'react-icons/hi'
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
  onDownloadAttachment
}: ConversationModalProps) {
  if (!isOpen || !conversation) return null

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

        <div className="modal-action border-t border-base-300 pt-4">
          <button
            onClick={onDeleteConversation}
            className="btn btn-error btn-sm"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Deleting...
              </>
            ) : (
              <>
                <HiTrash className="w-4 h-4 mr-1" />
                Delete Conversation
              </>
            )}
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConversationModal

