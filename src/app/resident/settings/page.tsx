'use client'

import React from 'react'
import { useAccountStore } from '@/store/accountStore'

const Settings = () => {
  const { account } = useAccountStore()

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
    </div>
  )
}

export default Settings
