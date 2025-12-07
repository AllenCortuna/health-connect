'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Report } from '@/interface/report'
import type { BHW } from '@/interface/user'
import { format, parseISO, startOfWeek } from 'date-fns'
import { HiCalendar, HiUser, HiDocumentText, HiChevronDown, HiChevronUp } from 'react-icons/hi'

function getWeekEnd(weekStart: Date): Date {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6) // Sunday
  return weekEnd
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [bhws, setBhws] = useState<BHW[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [bhwFilter, setBhwFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all') // 'all', 'this-week', 'this-month', 'last-month'
  
  useEffect(() => {
    fetchReports()
    fetchBHWs()
  }, [])
  
  const fetchReports = async () => {
    try {
      setIsLoading(true)
      const reportsRef = collection(db, 'reports')
      const q = query(reportsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const reportsData: Report[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const report = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Report
        reportsData.push(report)
      })
      
      setReports(reportsData)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchBHWs = async () => {
    try {
      const accountsRef = collection(db, 'accounts')
      const querySnapshot = await getDocs(accountsRef)
      
      const bhwsData: BHW[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.role === 'bhw') {
          bhwsData.push({
            id: doc.id,
            ...data
          } as BHW)
        }
      })
      
      setBhws(bhwsData)
    } catch (error) {
      console.error('Error fetching BHWs:', error)
    }
  }
  
  const getBHWName = (bhwId: string): string => {
    const bhw = bhws.find(b => b.id === bhwId)
    return bhw?.name || 'Unknown BHW'
  }
  
  const formatWeekRange = (weekStartISO: string): string => {
    try {
      const weekStart = parseISO(weekStartISO)
      const weekEnd = getWeekEnd(weekStart)
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    } catch {
      return weekStartISO
    }
  }
  
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a')
    } catch {
      return dateString
    }
  }
  
  const toggleExpand = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId)
  }
  
  // Filter reports
  const filteredReports = reports.filter((report) => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      report.bhwName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.remarks && report.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // BHW filter
    const matchesBHW = bhwFilter === 'all' || report.bhwId === bhwFilter
    
    // Date filter
    let matchesDate = true
    if (dateFilter !== 'all') {
      const reportDate = parseISO(report.createdAt)
      const now = new Date()
      
      if (dateFilter === 'this-week') {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 })
        matchesDate = reportDate >= weekStart
      } else if (dateFilter === 'this-month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        matchesDate = reportDate >= monthStart
      } else if (dateFilter === 'last-month') {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        matchesDate = reportDate >= lastMonthStart && reportDate <= lastMonthEnd
      }
    }
    
    return matchesSearch && matchesBHW && matchesDate
  })
  
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
        <h1 className="text-2xl font-bold text-secondary">BHW Reports</h1>
        <p className="text-sm text-gray-600 mt-1">View and manage weekly reports submitted by Barangay Health Workers</p>
      </div>

      {/* Search and Filter Section */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Search</span>
              </label>
              <input
                type="text"
                placeholder="Search by BHW name or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>

            {/* BHW Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by BHW</span>
              </label>
              <select
                value={bhwFilter}
                onChange={(e) => setBhwFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All BHWs</option>
                {bhws.map((bhw) => (
                  <option key={bhw.id} value={bhw.id}>
                    {bhw.name || bhw.email || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Date</span>
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Time</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-base-300">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredReports.length}</span> of <span className="font-semibold">{reports.length}</span> reports
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="text-center py-8">
                {reports.length === 0 ? (
                  <>
                    <p className="text-gray-500 mb-4">No reports found</p>
                    <p className="text-sm text-gray-400">Reports will appear here once BHWs submit their weekly reports.</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">No reports match your search criteria</p>
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setBhwFilter('all')
                        setDateFilter('all')
                      }}
                      className="btn btn-outline btn-secondary"
                    >
                      Clear Filters
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isExpanded = expandedReportId === report.id
            const weekStart = report.weekStart ? parseISO(report.weekStart) : null
            const weekEnd = weekStart ? getWeekEnd(weekStart) : null
            
            return (
              <div key={report.id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  {/* Report Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <HiUser className="w-5 h-5 text-secondary" />
                        <h3 className="text-lg font-semibold text-secondary">
                          {report.bhwName}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <HiCalendar className="w-4 h-4" />
                          <span>
                            {weekStart && weekEnd 
                              ? `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
                              : report.weekStart || 'N/A'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <HiDocumentText className="w-4 h-4" />
                          <span>{report.taskList.length} task{report.taskList.length !== 1 ? 's' : ''} completed</span>
                        </div>
                        
                        <div className="text-xs">
                          Created: {formatDate(report.createdAt)}
                        </div>
                      </div>
                      
                      {report.remarks && (
                        <div className="mt-3 p-3 bg-base-200 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Remarks:</span> {report.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleExpand(report.id)}
                      className="btn btn-ghost btn-sm btn-circle"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <HiChevronUp className="w-5 h-5" />
                      ) : (
                        <HiChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-base-300">
                      <h4 className="font-semibold text-secondary mb-3">Completed Tasks:</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {report.taskList.length > 0 ? (
                          report.taskList.map((task, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-base-200 rounded">
                              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">{task}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No tasks listed</p>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-base-300 text-xs text-gray-500">
                        <div>Report ID: {report.id}</div>
                        <div>Last updated: {formatDate(report.updatedAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
