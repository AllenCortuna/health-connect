'use client'

import React, { useState, useEffect } from 'react'
import { useAccountStore } from '@/store/accountStore'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Resident } from '@/interface/user'
import StatusBadge from '@/components/common/StatusBadge'

const Settings = () => {
  const { account } = useAccountStore()
  const [residents, setResidents] = useState<Resident[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (account?.email) {
      fetchHouseholdAndResidents()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.email])

  const fetchHouseholdAndResidents = async () => {
    if (!account?.email) return

    try {
      setIsLoading(true)
      
      // First, find the household by email
      const householdsRef = collection(db, 'household')
      const householdQuery = query(householdsRef, where('email', '==', account.email))
      const householdSnapshot = await getDocs(householdQuery)
      
      if (!householdSnapshot.empty) {
        const householdData = householdSnapshot.docs[0].data()
        
        // Then, find all residents for this household
        const householdNumber = householdData.householdNumber
        if (householdNumber) {
          const residentsRef = collection(db, 'resident')
          const residentsQuery = query(residentsRef, where('householdId', '==', householdNumber))
          const residentsSnapshot = await getDocs(residentsQuery)
          
          const residentsData: Resident[] = []
          residentsSnapshot.forEach((doc) => {
            const data = doc.data()
            residentsData.push({
              id: doc.id,
              ...data,
              birthDate: data.birthDate?.toDate?.() || data.birthDate,
              createdAt: data.createdAt?.toDate?.() || data.createdAt
            } as Resident)
          })
          
          setResidents(residentsData)
        }
      }
    } catch (error) {
      console.error('Error fetching household and residents:', error)
    } finally {
      setIsLoading(false)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4 text-secondary font-bold">Account Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold">Name</span>
              </label>
              <input
                type="text"
                value={account?.headOfHousehold || ''}
                className="input input-bordered text-xs"
                disabled
              />
            </div>
            
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <input
                type="email"
                value={account?.email || ''}
                className="input input-bordered text-xs"
                disabled
              />
            </div>
            
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold">Contact Number</span>
              </label>
              <input
                type="tel"
                value={account?.headOfHouseholdContactNumber || 'N/A'}
                className="input input-bordered text-xs"
                disabled
              />
            </div>
            
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold">Address</span>
              </label>
              <input
                type="text"
                value={account?.address || ''}
                className="input input-bordered text-xs"
                disabled
              />
            </div>
          </div>
          
          <div className="mt-10 ">
            <p className="text-xs text-gray-500">
              To update your information, please contact your local health worker or administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Family Members List */}
      <div className="card bg-base-100 shadow-lg mt-6">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4 text-secondary font-bold">Family Members</h2>
          
          {residents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No family members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Birth Date</th>
                    <th>Status</th>
                    <th>Marginalized Group</th>
                    <th>Contact Number</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.map((resident) => (
                    <tr key={resident.id} className="hover text-xs">
                      <td>
                        <div className="font-medium">
                          {resident.fullName}
                        </div>
                      </td>
                      <td>
                        <span className="capitalize">{resident.gender}</span>
                      </td>
                      <td>
                        {resident.birthDate instanceof Date 
                          ? resident.birthDate.toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        <StatusBadge status={resident.marginalizedGroup?.find(g => ['child', 'adult', 'senior', 'pwd', 'pregnant'].includes(g)) || 'adult'} size="xs" />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {resident.marginalizedGroup && resident.marginalizedGroup.length > 0 ? (
                            resident.marginalizedGroup.map((group) => (
                              <span
                                key={group}
                                className="badge badge-sm badge-outline"
                                title={group}
                              >
                                {group === 'IPs'
                                  ? "IP's"
                                  : group === '4ps'
                                    ? '4Ps'
                                    : group === 'pwd'
                                      ? 'PWD'
                                      : group === 'solo parent'
                                        ? 'Solo Parent'
                                        : group.charAt(0).toUpperCase() + group.slice(1)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {resident.contactNumber || 'N/A'}
                      </td>
                      <td>
                        {resident.email || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
