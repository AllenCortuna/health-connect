'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MonthlyReport } from '@/interface/data'
import type { BHW } from '@/interface/user'
import { format, parseISO } from 'date-fns'
import {
  FaFilePdf,
  FaImage,
  FaDownload,
  FaEye,
  FaChevronUp,
  FaChevronDown,
} from 'react-icons/fa'

export default function AdminMonthlyReportsPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [bhws, setBhws] = useState<BHW[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
  
  // Filters - initialize month filter to current month
  const [monthFilter, setMonthFilter] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [bhwFilter, setBhwFilter] = useState<string>('all')

  useEffect(() => {
    fetchReports()
    fetchBHWs()
  }, [])

  const fetchReports = async () => {
    try {
      setIsLoading(true)
      const reportsRef = collection(db, 'monthly-reports')
      const q = query(reportsRef, orderBy('reportDate', 'desc'))
      const querySnapshot = await getDocs(q)

      const reportsData: MonthlyReport[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const report = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as MonthlyReport
        reportsData.push(report)
      })

      setReports(reportsData)
    } catch (error) {
      console.error('Error fetching monthly reports:', error)
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

  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString)
      return format(date, 'MMMM yyyy')
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string): string => {
    try {
      const date = parseISO(dateString)
      return format(date, 'MMM d, yyyy h:mm a')
    } catch {
      return dateString
    }
  }

  const toggleExpand = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId)
  }

  const getFileType = (url: string): 'image' | 'pdf' => {
    const extension = url.split('.').pop()?.toLowerCase()
    if (extension === 'pdf') return 'pdf'
    return 'image'
  }

  const openFile = (url: string) => {
    window.open(url, '_blank')
  }

  const downloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get unique months from reports
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>()
    reports.forEach(report => {
      if (report.reportDate) {
        try {
          const date = parseISO(report.reportDate)
          const monthKey = format(date, 'yyyy-MM')
          months.add(monthKey)
        } catch {
          // Skip invalid dates
        }
      }
    })
    return Array.from(months).sort().reverse()
  }, [reports])

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Month filter
      let matchesMonth = true
      if (monthFilter !== 'all') {
        try {
          const reportDate = parseISO(report.reportDate)
          const reportMonthKey = format(reportDate, 'yyyy-MM')
          matchesMonth = reportMonthKey === monthFilter
        } catch {
          matchesMonth = false
        }
      }

      // BHW filter
      const matchesBHW = bhwFilter === 'all' || report.bhwId === bhwFilter

      return matchesMonth && matchesBHW
    })
  }, [reports, monthFilter, bhwFilter])

  // Get BHW name by ID
  const getBhwName = (bhwId: string): string => {
    const bhw = bhws.find(b => b.id === bhwId)
    return bhw?.name || bhw?.email || 'Unknown BHW'
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
        <h1 className="text-2xl font-bold text-secondary">Monthly Reports</h1>
        <p className="text-sm text-gray-600 mt-1">
          View monthly reports submitted by Barangay Health Workers
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Month Filter */}
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-xs mb-2">Filter by Month</span>
              </label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Months</option>
                {uniqueMonths.map((monthKey) => {
                  try {
                    const date = parseISO(`${monthKey}-01`)
                    const displayMonth = format(date, 'MMMM yyyy')
                    return (
                      <option key={monthKey} value={monthKey}>
                        {displayMonth}
                      </option>
                    )
                  } catch {
                    return null
                  }
                })}
              </select>
            </div>

            {/* BHW Filter */}
            <div className="form-control flex flex-col">
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
          </div>
          
          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-base-300">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredReports.length}</span> of{' '}
              <span className="font-semibold">{reports.length}</span> reports
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="text-center py-8">
              {reports.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-4">No monthly reports found</p>
                  <p className="text-sm text-gray-400">
                    Reports will appear here once BHWs submit their monthly reports.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">No reports match your filter criteria</p>
                  <button
                    onClick={() => {
                      setMonthFilter('all')
                      setBhwFilter('all')
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
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isExpanded = expandedReportId === report.id
            const fileCount: number = report.contents?.length || 0

            return (
              <div key={report.id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  {/* Report Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-secondary">
                          {formatDate(report.reportDate)}
                        </h3>
                        <span className="badge badge-secondary badge-sm">
                          {fileCount} {fileCount === 1 ? 'file' : 'files'}
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center gap-4 text-xs text-gray-600">
                        <div>
                          <span className="font-semibold">BHW:</span> {getBhwName(report.bhwId)}
                        </div>
                        <div>
                          <span className="font-semibold">Barangay:</span>{' '}
                          {report.barangay || 'N/A'}
                        </div>
                        <div>
                          <span className="font-semibold">Submitted:</span>{' '}
                          {formatDateTime(report.createdAt)}
                        </div>
                        {report.updatedAt !== report.createdAt && (
                          <div>
                            <span className="font-semibold">Last Updated:</span>{' '}
                            {formatDateTime(report.updatedAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(report.id)}
                      className="btn btn-ghost btn-sm btn-circle"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <FaChevronUp className="w-5 h-5" />
                      ) : (
                        <FaChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Files List */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-base-300">
                      <h4 className="font-semibold text-secondary mb-3">Uploaded Files:</h4>
                      {fileCount === 0 ? (
                        <p className="text-sm text-gray-500">No files uploaded</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {report.contents.map((fileUrl, index) => {
                            const fileType = getFileType(fileUrl)
                            const fileName = fileUrl.split('/').pop() || `File ${index + 1}`

                            return (
                              <div
                                key={index}
                                className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="card-body p-4">
                                  <div className="flex items-center gap-3 mb-3">
                                    {fileType === 'image' ? (
                                      <FaImage className="text-secondary text-xl" />
                                    ) : (
                                      <FaFilePdf className="text-error text-xl" />
                                    )}
                                    <span className="text-xs font-medium truncate flex-1">
                                      {fileName}
                                    </span>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => openFile(fileUrl)}
                                      className="btn btn-outline btn-secondary btn-xs flex-1"
                                      title="View File"
                                    >
                                      <FaEye className="mr-1" />
                                      View
                                    </button>
                                    <button
                                      onClick={() => downloadFile(fileUrl, fileName)}
                                      className="btn btn-outline btn-primary btn-xs flex-1"
                                      title="Download File"
                                    >
                                      <FaDownload className="mr-1" />
                                      Download
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-base-300 text-xs text-gray-500">
                        <div>Report ID: {report.id}</div>
                        <div>BHW ID: {report.bhwId}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
