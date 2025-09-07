import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'

/**
 * Custom hook to fetch and track unread messages for the current user
 * @returns {number} count of unread messages
 */
export const useUnreadMessages = (): number => {
  const { account } = useAccountStore()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!account?.id) {
      setUnreadCount(0)
      return
    }

    // Create a query for unread messages where current user is the receiver
    const messagesRef = collection(db, 'messages')
    const q = query(
      messagesRef,
      where('receiverId', '==', account.id),
      where('status', '==', 'unread')
    )

    // Set up real-time listener for unread messages
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setUnreadCount(querySnapshot.size)
    }, (error) => {
      console.error('Error fetching unread messages:', error)
      setUnreadCount(0)
    })

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [account?.id])

  return unreadCount
}
