"use client"
import React from 'react'
import NavLayout from '@/components/common/NavLayout'
import { HiHome } from 'react-icons/hi';
import { HiChatBubbleLeftRight, HiCog6Tooth } from 'react-icons/hi2';
import { NavigationItemProps } from '@/components/common/NavigationItem'
import RouteGuard from '@/components/common/RouteGuard';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const unreadCount = useUnreadMessages()
  
  const primaryNavItems: NavigationItemProps[] = [
    { href: "/resident/dashboard", icon: HiHome, label: "Dashboard"},
    { 
      href: "/resident/message", 
      icon: HiChatBubbleLeftRight, 
      label: "Messages",
      showNotification: unreadCount > 0,
      notificationCount: unreadCount
    },
    { href: "/resident/settings", icon: HiCog6Tooth, label: "Settings"},
  ];

  return (
    <div className='bg-base-100 h-screen w-screen'>
      <RouteGuard role="resident" collectionName="resident">
        <NavLayout primaryNavItems={primaryNavItems} secondaryNavItems={[]}>
            {children}
        </NavLayout>  
      </RouteGuard>
    </div>
  )
}

export default Layout
