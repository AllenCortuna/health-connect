'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { useRouter } from 'next/navigation'
import type { MonthlyReport } from '@/interface/data'
import {
  FaArrowLeft,
  FaPlus,
  FaFilePdf,
  FaImage,
  FaDownload,
  FaEye,
  FaChevronUp,
  FaChevronDown,
  FaEdit,
} from 'react-icons/fa'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

export default function MonthlyReportList() {
  const router = useRouter()
  const { account } = useAccountStore()
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)

  useEffect(() => {
    if (account?.id) {
      fetchReports()
    } else if (account && account.role !== 'bhw') {
      router.push('/bhw/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, router])

  const fetchReports = async () => {
    if (!account?.id) return
    console.log('account.id', account.id)

    try {
      setIsLoading(true)
      const reportsRef = collection(db, 'monthly-reports')
      const q = query(
        reportsRef,
        where('bhwId', '==', account.id),
        orderBy('reportDate', 'desc')
      )
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/bhw/reports')}
            className="btn btn-ghost btn-sm"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-secondary">Monthly Reports</h1>
        </div>
        <button
          onClick={() => router.push('/bhw/reports/monthly/upload')}
          className="btn btn-secondary btn-sm"
        >
          <FaPlus className="mr-2" />
          Upload Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4 text-lg">No monthly reports found</p>
              <p className="text-sm text-gray-400 mb-6">
                Start by uploading your first monthly report
              </p>
              <button
                onClick={() => router.push('/bhw/reports/monthly/upload')}
                className="btn btn-secondary"
              >
                <FaPlus className="mr-2" />
                Upload Monthly Report
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isExpanded = expandedReportId === report.id
            const fileCount = report.contents?.length || 0 as number

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

                      <div className="flex md:flex-row gap-20 text-xs text-gray-600">
                        <div className="my-auto">
                          <span className="font-semibold">Submitted:</span>{' '}
                          {formatDateTime(report.createdAt)}
                        </div>
                        {report.updatedAt !== report.createdAt && (
                          <div className="my-auto">
                            <span className="font-semibold">Last Updated:</span>{' '}
                            {formatDateTime(report.updatedAt)}
                          </div>
                        )}
                        <Link href={`/bhw/reports/monthly/edit?id=${report.id}`} className="btn btn-ghost btn-xs">
                          <FaEdit className="mr-1" />
                          Edit
                        </Link>
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
                      {fileCount === 0 as number ? (
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
                        <div>Barangay: {report.barangay || 'N/A'}</div>
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
