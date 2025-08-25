"use client"
import React from 'react'
import NavLayout from '@/components/common/NavLayout'
import { HiHome, HiUserGroup, HiUsers, HiBeaker, HiDocumentReport } from 'react-icons/hi';
import { NavigationItemProps } from '@/components/common/NavigationItem'
import RouteGuard from '@/components/common/RouteGuard';

const layout = ({ children }: { children: React.ReactNode }) => {
  const primaryNavItems: NavigationItemProps[] = [
    { href: "/admin/dashboard", icon: HiHome, label: "Dashboard"},
    { href: "/admin/resident", icon: HiUserGroup, label: "Resident"},
    { href: "/admin/bhw", icon: HiUsers, label: "BHW"},
    { href: "/admin/medicines", icon: HiBeaker, label: "Medicines"},
    { href: "/admin/reports", icon: HiDocumentReport, label: "Reports"},
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

export default layout