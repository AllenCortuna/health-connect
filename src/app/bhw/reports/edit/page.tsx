'use client'

import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { startOfWeek, format } from 'date-fns'

function getWeekEnd(weekStart: Date): Date {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6) // Sunday
  return weekEnd
}
import { HiArrowLeft, HiCalendar, HiCheckCircle } from 'react-icons/hi'
import type { Report } from '@/interface/report'
import type { BHW } from '@/interface/user'

// Task list from bhwTaskList.md
const BHW_TASKS = [
  'Monitored blood pressure of senior citizen/ postpartum/ lactating mothers/ pregnant',
  'Monitored height and weight of malnourished children.',
  'Monitored height and weight of 4ps members.',
  'Screened blood pressure of patients.',
  'Monitored blood pressure.',
  'Reweighed malnourish children.',
  'Assisted midwife during monthly immunization.',
  'Assisted midwife during prenatal check-up.',
  'Assisted midwife during follow up visits to postpartum/ pregnant women/ lactating mother.',
  'Assisted midwife during home visits to EPI defaulters.',
  'Assisted midwife in conducting Pap smear.',
  'Tracked pregnant women.',
  'Conducted home visits to postpartum/ lactating mother/ pregnant women.',
  'Conducted case finding of malnourish children.',
  'Conducted case finding of TB patients.',
  'Conducted interview for family planning user.',
  'Dispensed pills to family planning user.',
  'Dispensed TB drugs to TB patients.',
  'Assisted during medical check-up at RHU.',
  'Encouraged women to do Pap smear.',
  'Encouraged women to use family planning/ pills/ DMPA/ implant.',
  'Assisted BNS in Operation Timbang.',
  'Conducted weighing of children 0-59 months old for Operation Timbang.',
  'Conducted house to house survey.',
  'Distributed Vitamin A to children 6-59 months old.',
  'Distributed deworming tablets to 12-59 months old.',
  'Assisted RHU staffs in MR-SIA/ SBI.',
  'Assisted RHU staffs in medical mission.',
  'Assisted RHU staffs in konsulta sa barangay.',
  'Assisted midwife/ nurse in immunization of HPV/ Flu vaccine/ Pneumococcal vaccine',
  'Conducted interview to new senior citizens.',
  'Visiter/households with sick member and refer them to the health facility.'
]

export default function EditReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reportId = searchParams.get('id')
  
  const { account } = useAccountStore()
  const bhwAccount = account?.role === 'bhw' ? (account as unknown as BHW) : undefined
  
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [remarks, setRemarks] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  
  useEffect(() => {
    if (reportId) {
      fetchReport()
    } else {
      alert('Report ID is required')
      router.push('/bhw/reports')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])
  
  // Verify report belongs to current user
  useEffect(() => {
    if (report && account && report.bhwId !== account.id) {
      alert('You do not have permission to edit this report')
      router.push('/bhw/reports')
    }
  }, [report, account, router])
  
  const fetchReport = async () => {
    try {
      setIsLoading(true)
      const reportRef = doc(db, 'reports', reportId!)
      const reportSnap = await getDoc(reportRef)
      
      if (reportSnap.exists()) {
        const data = reportSnap.data()
        const reportData: Report = {
          id: reportSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Report
        
        setReport(reportData)
        setRemarks(reportData.remarks || '')
        setSelectedTasks(reportData.taskList || [])
      } else {
        alert('Report not found')
        router.push('/bhw/reports')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      alert('Failed to fetch report data')
      router.push('/bhw/reports')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleTaskToggle = (task: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(task)) {
        return prev.filter(t => t !== task)
      } else {
        return [...prev, task]
      }
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!account || !bhwAccount || !report) return
    if (selectedTasks.length === 0) {
      alert('Please select at least one task')
      return
    }
    
    setIsSaving(true)
    try {
      const reportData: Omit<Report, 'id' | 'createdAt'> = {
        remarks: remarks.trim() || "",
        bhwId: account.id,
        bhwName: bhwAccount.name || account.email || 'Unknown',
        taskList: selectedTasks,
        weekStart: report.weekStart,
        updatedAt: new Date().toISOString()
      }
      
      const reportRef = doc(db, 'reports', report.id)
      await updateDoc(reportRef, reportData)
      
      alert('Report updated successfully!')
      router.push('/bhw/reports')
    } catch (error) {
      console.error('Error updating report:', error)
      alert('Error updating report. Please try again.')
    } finally {
      setIsSaving(false)
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
  
  if (!report) {
    return null
  }
  
  // Calculate week dates for display
  const weekStart = report.weekStart ? new Date(report.weekStart) : startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = getWeekEnd(weekStart)
  
  return (
    <div className="container mx-auto pb-20 w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-circle"
        >
          <HiArrowLeft className="w-5 h-5 text-secondary" />
        </button>
        <h1 className="text-2xl font-bold text-secondary">Edit Report</h1>
      </div>
      
      {/* Week Info */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <HiCalendar className="w-4 h-4" />
            <span className="font-semibold">
              Week of {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <HiCheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs text-gray-600">
              Report created on {format(new Date(report.createdAt), 'MMMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Report Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Remarks */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="form-control flex flex-col gap-1">
              <label className="label">
                <span className="label-text font-semibold text-xs">Remarks</span>
              </label>
              <textarea
                className="textarea w-full textarea-bordered h-16 resize-none text-xs"
                placeholder="Enter report remarks (optional)..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Task Selection */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title font-semibold text-secondary mb-4">
              Select Tasks Completed <span className="text-error">*</span>
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Select all tasks you completed during this week. At least one task must be selected.
            </p>
            
            <div className="max-h-96 overflow-y-auto">
              {BHW_TASKS.map((task, index) => (
                <label key={index} className="flex items-start gap-2 p-3 rounded-lg hover:bg-base-200 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox-xs rounded-none checkbox-primary mt-1"
                    checked={selectedTasks.includes(task)}
                    onChange={() => handleTaskToggle(task)}
                  />
                  <span className="text-xs text-zinc-600 flex-1">{task}</span>
                </label>
              ))}
            </div>
            
            {selectedTasks.length > 0 && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-semibold text-secondary">
                  {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-outline"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving || selectedTasks.length === 0}
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Updating...
              </>
            ) : (
              'Update Report'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
