'use client'

import React from 'react'
import { useAccountStore } from '@/store/accountStore'

const Dashboard = () => {
  const { account } = useAccountStore()

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {account?.name || 'Resident'}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg">Quick Actions</h2>
            <div className="space-y-2">
              <button className="btn btn-primary btn-sm w-full">
                Send Message
              </button>
              <button className="btn btn-outline btn-sm w-full">
                View Profile
              </button>
            </div>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg">Recent Messages</h2>
            <p className="text-gray-500 text-sm">No recent messages</p>
          </div>
        </div>

        {/* Health Information */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg">Health Information</h2>
            <p className="text-gray-500 text-sm">Your health records and information</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
