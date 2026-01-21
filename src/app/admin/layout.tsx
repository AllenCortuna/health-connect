"use client"
import React from 'react'
import NavLayout from '@/components/common/NavLayout'
import { HiHome, HiUserGroup, HiUsers, HiBeaker, HiDocumentReport } from 'react-icons/hi';
import { NavigationItemProps } from '@/components/common/NavigationItem'
import RouteGuard from '@/components/common/RouteGuard';
import { HiChatBubbleLeftRight, HiCog6Tooth } from 'react-icons/hi2';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const unreadCount = useUnreadMessages()
  
  const primaryNavItems: NavigationItemProps[] = [
    { href: "/admin/dashboard", icon: HiHome, label: "Dashboard"},
    { href: "/admin/resident", icon: HiUserGroup, label: "Residents"},
    { href: "/admin/bhw", icon: HiUsers, label: "BHW"},
    { 
      href: "/admin/message", 
      icon: HiChatBubbleLeftRight, 
      label: "Messages",
      showNotification: unreadCount > 0,
      notificationCount: unreadCount
    },
    { href: "/admin/medicine", icon: HiBeaker, label: "Medicines"},
    { href: "/admin/reports", icon: HiDocumentReport, label: "Reports"},
    { href: "/admin/settings", icon: HiCog6Tooth, label: "Settings"},
  ];

  return (
    <div className='bg-base-100 h-screen w-screen'>
      <RouteGuard role="admin" collectionName="accounts">
        <NavLayout primaryNavItems={primaryNavItems} secondaryNavItems={[]}>
            {children}
        </NavLayout>  
      </RouteGuard>
    </div>
  )
}

export default Layout