"use client"
import React from 'react'
import NavLayout from '@/components/common/NavLayout'
import { HiHome, HiUserGroup, HiBeaker, HiBell, HiPrinter } from 'react-icons/hi';
import { IoMdSettings } from 'react-icons/io';
import { NavigationItemProps } from '@/components/common/NavigationItem'
import RouteGuard from '@/components/common/RouteGuard';

const layout = ({ children }: { children: React.ReactNode }) => {
  const primaryNavItems: NavigationItemProps[] = [
    { href: "/bhw/dashboard", icon: HiHome, label: "Dashboard"},
    { href: "/bhw/resident", icon: HiUserGroup, label: "Update Resident"},
    { href: "/bhw/medicine", icon: HiBeaker, label: "Track Medicines"},
    { href: "/bhw/announcements", icon: HiBell, label: "Announcements"},
    { href: "/bhw/reports", icon: HiPrinter, label: "Print Reports"},
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

export default layout