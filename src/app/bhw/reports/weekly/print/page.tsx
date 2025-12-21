'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { format, parseISO } from 'date-fns'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import type { Report } from '@/interface/report'
import type { BHW } from '@/interface/user'
import { HiArrowLeft, HiPrinter } from 'react-icons/hi'

function getWeekEnd(weekStart: Date): Date {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  return weekEnd
}

// PDF Document Component
function ReportPDF({ report, bhwDetails, weekStart, weekEnd }: {
  report: Report
  bhwDetails: BHW | null
  weekStart: Date
  weekEnd: Date
}) {
  const printDate = new Date()
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Report</Text>
          <Text style={styles.subtitle}>Barangay Health Worker</Text>
        </View>

        {/* BHW Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BHW Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{report.bhwName || bhwDetails?.name || 'N/A'}</Text>
          </View>
          {bhwDetails?.contactNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Contact Number:</Text>
              <Text style={styles.value}>{bhwDetails.contactNumber}</Text>
            </View>
          )}
          {bhwDetails?.address && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{bhwDetails.address}</Text>
            </View>
          )}
          {bhwDetails?.email && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{bhwDetails.email}</Text>
            </View>
          )}
        </View>

        {/* Week Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Period</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Week:</Text>
            <Text style={styles.value}>
              {format(weekStart, 'MMMM d, yyyy')} - {format(weekEnd, 'MMMM d, yyyy')}
            </Text>
          </View>
        </View>

        {/* Tasks Completed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks Completed</Text>
          <Text style={styles.taskCount}>
            Total: {report.taskList.length} task{report.taskList.length !== 1 ? 's' : ''}
          </Text>
          <View style={styles.taskList}>
            {report.taskList.map((task, index) => (
              <View key={index} style={styles.taskItem}>
                <Text style={styles.taskNumber}>{index + 1}.</Text>
                <Text style={styles.taskText}>{task}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Remarks */}
        {report.remarks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Remarks</Text>
            <Text style={styles.remarksText}>{report.remarks}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Date Printed:</Text>
            <Text style={styles.footerValue}>{format(printDate, 'MMMM d, yyyy h:mm a')}</Text>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Report Created:</Text>
            <Text style={styles.footerValue}>
              {report.createdAt ? format(parseISO(report.createdAt), 'MMMM d, yyyy h:mm a') : 'N/A'}
            </Text>
          </View>
          {report.updatedAt !== report.createdAt && (
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Last Updated:</Text>
              <Text style={styles.footerValue}>
                {format(parseISO(report.updatedAt), 'MMMM d, yyyy h:mm a')}
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
    borderBottom: '1 solid #ccc',
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 140,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    flex: 1,
    color: '#000',
  },
  taskCount: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  taskList: {
    marginTop: 5,
  },
  taskItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 5,
  },
  taskNumber: {
    width: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  taskText: {
    flex: 1,
    color: '#000',
    lineHeight: 1.5,
  },
  remarksText: {
    marginTop: 5,
    lineHeight: 1.6,
    color: '#000',
    textAlign: 'justify',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1 solid #ccc',
    fontSize: 9,
  },
  footerRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  footerLabel: {
    width: 100,
    color: '#666',
  },
  footerValue: {
    flex: 1,
    color: '#333',
  },
})

export default function PrintReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { account } = useAccountStore()
  const bhwAccount = account?.role === 'bhw' ? (account as unknown as BHW) : undefined
  
  const [report, setReport] = useState<Report | null>(null)
  const [bhwDetails, setBhwDetails] = useState<BHW | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [weekStart, setWeekStart] = useState<Date | null>(null)
  const [weekEnd, setWeekEnd] = useState<Date | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const reportId = searchParams.get('id')
        const weekStartParam = searchParams.get('weekStart')

        if (!account?.id) {
          router.push('/bhw/reports')
          return
        }

        // Fetch BHW details
        if (account.id) {
          try {
            const bhwDoc = await getDoc(doc(db, 'bhw', account.id))
            if (bhwDoc.exists()) {
              setBhwDetails({ id: bhwDoc.id, ...bhwDoc.data() } as BHW)
            } else {
              setBhwDetails(bhwAccount || null)
            }
          } catch (error) {
            console.error('Error fetching BHW details:', error)
            setBhwDetails(bhwAccount || null)
          }
        }

        // Fetch report
        let reportData: Report | null = null
        
        if (reportId) {
          // Fetch by report ID
          const reportDoc = await getDoc(doc(db, 'reports', reportId))
          if (reportDoc.exists()) {
            reportData = { id: reportDoc.id, ...reportDoc.data() } as Report
          }
        } else if (weekStartParam) {
          // Fetch by weekStart
          const reportsRef = collection(db, 'reports')
          const q = query(
            reportsRef,
            where('bhwId', '==', account.id),
            where('weekStart', '==', weekStartParam)
          )
          const querySnapshot = await getDocs(q)
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]
            reportData = { id: doc.id, ...doc.data() } as Report
          }
        }

        if (!reportData) {
          alert('Report not found')
          router.push('/bhw/reports')
          return
        }

        setReport(reportData)
        
        // Calculate week dates
        const weekStartDate = parseISO(reportData.weekStart)
        const weekEndDate = getWeekEnd(weekStartDate)
        setWeekStart(weekStartDate)
        setWeekEnd(weekEndDate)
      } catch (error) {
        console.error('Error fetching report:', error)
        alert('Error loading report')
        router.push('/bhw/reports')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [searchParams, account, router, bhwAccount])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  if (!report || !weekStart || !weekEnd) {
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-error">
          <span>Report not found</span>
        </div>
        <button onClick={() => router.push('/bhw/reports')} className="btn btn-primary mt-4">
          Back to Reports
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/bhw/reports')}
          className="btn btn-ghost btn-sm mb-4"
        >
          <HiArrowLeft className="w-4 h-4 mr-2" />
          Back to Reports
        </button>
        <h1 className="text-2xl font-bold text-secondary mb-4">Print Weekly Report</h1>
      </div>

      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Week: {format(weekStart, 'MMMM d, yyyy')} - {format(weekEnd, 'MMMM d, yyyy')}
              </p>
              <p className="text-xs text-gray-500">
                {report.taskList.length} task{report.taskList.length !== 1 ? 's' : ''} completed
              </p>
            </div>
            <PDFDownloadLink
              document={<ReportPDF report={report} bhwDetails={bhwDetails} weekStart={weekStart} weekEnd={weekEnd} />}
              fileName={`weekly-report-${format(weekStart, 'yyyy-MM-dd')}.pdf`}
              className="btn btn-primary"
            >
              {({ loading }) => (
                <>
                  <HiPrinter className="w-4 h-4 mr-2" />
                  {loading ? 'Preparing PDF...' : 'Download PDF'}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          <div className="hidden md:block" style={{ height: '800px', width: '100%' }}>
            <PDFViewer width="100%" height="100%">
              <ReportPDF report={report} bhwDetails={bhwDetails} weekStart={weekStart} weekEnd={weekEnd} />
            </PDFViewer>
          </div>
          <div className="md:hidden p-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              PDF preview is not available on mobile devices. Please download the PDF to view it.
            </p>
            <PDFDownloadLink
              document={<ReportPDF report={report} bhwDetails={bhwDetails} weekStart={weekStart} weekEnd={weekEnd} />}
              fileName={`weekly-report-${format(weekStart, 'yyyy-MM-dd')}.pdf`}
              className="btn btn-primary"
            >
              {({ loading }) => (
                <>
                  <HiPrinter className="w-4 h-4 mr-2" />
                  {loading ? 'Preparing PDF...' : 'Download PDF'}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>
    </div>
  )
}
