"use client"
import React from 'react'
import NavLayout from '@/components/common/NavLayout'
import { HiHome, HiUserGroup, HiBeaker, HiBell, HiPrinter } from 'react-icons/hi';
import { HiChatBubbleLeftRight } from 'react-icons/hi2';
import { IoMdSettings } from 'react-icons/io';
import { HiBuildingOffice } from 'react-icons/hi2';
import { NavigationItemProps } from '@/components/common/NavigationItem'
import RouteGuard from '@/components/common/RouteGuard';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const unreadCount = useUnreadMessages()
  
  const primaryNavItems: NavigationItemProps[] = [
    { href: "/bhw/dashboard", icon: HiHome, label: "Dashboard"},
    { href: "/bhw/household", icon: HiBuildingOffice, label: "Households"},
    { href: "/bhw/resident", icon: HiUserGroup, label: "Residents"},
    { href: "/bhw/medicine", icon: HiBeaker, label: "Track Medicines"},
    { 
      href: "/bhw/message", 
      icon: HiChatBubbleLeftRight, 
      label: "Messages",
      showNotification: unreadCount > 0,
      notificationCount: unreadCount
    },
    { href: "/bhw/announcement", icon: HiBell, label: "Announcements"},
    { href: "/bhw/reports", icon: HiPrinter, label: "Reports"},
    { href: "/bhw/settings", icon: IoMdSettings, label: "Settings"},
  ];

  return (
    <div className='bg-base-100 h-screen w-screen'>
      <RouteGuard role="bhw" collectionName="accounts">
        <NavLayout primaryNavItems={primaryNavItems} secondaryNavItems={[]}>
            {children}
        </NavLayout>  
      </RouteGuard>
    </div>
  )
}

export default Layout