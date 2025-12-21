'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAccountStore } from '@/store/accountStore'
import { startOfWeek, format, subWeeks, addWeeks } from 'date-fns'
import { HiCalendar, HiCheckCircle, HiXCircle, HiChevronLeft, HiChevronRight, HiPencil, HiPrinter } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
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

function getWeekStart(date: Date = new Date()): Date {
  // Get Monday of the current week (weekStartsOn: 1 means Monday)
  return startOfWeek(date, { weekStartsOn: 1 })
}

function getWeekEnd(weekStart: Date): Date {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6) // Sunday
  return weekEnd
}

export default function ReportsPage() {
  const router = useRouter()
  const { account } = useAccountStore()
  const bhwAccount = account?.role === 'bhw' ? (account as unknown as BHW) : undefined
  
  const [existingReport, setExistingReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [remarks, setRemarks] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  
  // Week selection state - allow selecting past weeks
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getWeekStart())
  
  // Week calculation
  const weekStart = selectedWeekStart
  const weekEnd = getWeekEnd(weekStart)
  const weekStartISO = format(weekStart, 'yyyy-MM-dd')
  
  // Navigation functions for week selection
  const goToPreviousWeek = () => {
    setSelectedWeekStart(prev => subWeeks(prev, 1))
  }
  
  const goToNextWeek = () => {
    const nextWeek = addWeeks(selectedWeekStart, 1)
    const currentWeek = getWeekStart()
    // Don't allow going to future weeks
    if (nextWeek <= currentWeek) {
      setSelectedWeekStart(nextWeek)
    }
  }
  
  const goToCurrentWeek = () => {
    setSelectedWeekStart(getWeekStart())
  }
  
  // Check if report exists for current week
  useEffect(() => {
    if (!account?.id) return
    
    const checkExistingReport = async () => {
      try {
        setIsLoading(true)
        const reportsRef = collection(db, 'reports')
        const q = query(
          reportsRef,
          where('bhwId', '==', account.id),
          where('weekStart', '==', weekStartISO)
        )
        
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]
          const reportData = {
            id: doc.id,
            ...doc.data()
          } as Report
          
          setExistingReport(reportData)
          setRemarks(reportData.remarks || '')
          setSelectedTasks(reportData.taskList || [])
        } else {
          setExistingReport(null)
          setRemarks('')
          setSelectedTasks([])
        }
      } catch (error) {
        console.error('Error checking existing report:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkExistingReport()
  }, [account?.id, weekStartISO])
  
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
    
    if (!account || !bhwAccount) return
    if (selectedTasks.length === 0) {
      alert('Please select at least one task')
      return
    }
    
    setIsSaving(true)
    try {
      const reportData: Omit<Report, 'id'> = {
        remarks: remarks.trim() || "",
        bhwId: account.id,
        bhwName: bhwAccount.name || account.email || 'Unknown',
        taskList: selectedTasks,
        weekStart: weekStartISO,
        createdAt: existingReport?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      if (existingReport) {
        // Update existing report
        const reportRef = doc(db, 'reports', existingReport.id)
        await updateDoc(reportRef, reportData)
      } else {
        // Create new report
        const reportsRef = collection(db, 'reports')
        await addDoc(reportsRef, reportData)
      }
      
      // Refresh the page data
      const reportsRef = collection(db, 'reports')
      const q = query(
        reportsRef,
        where('bhwId', '==', account.id),
        where('weekStart', '==', weekStartISO)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        const updatedReport = {
          id: doc.id,
          ...doc.data()
        } as Report
        setExistingReport(updatedReport)
      }
      
      alert(existingReport ? 'Report updated successfully!' : 'Report saved successfully!')
    } catch (error) {
      console.error('Error saving report:', error)
      alert('Error saving report. Please try again.')
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
  
  return (
    <div className="container mx-auto pb-20 w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary mb-4">Weekly Reports</h1>
        
        {/* Week Selector */}
        <div className="card bg-base-100 shadow-lg mb-4">
          <div className="card-body p-4">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={goToPreviousWeek}
                className="btn btn-ghost btn-sm btn-circle"
                title="Previous week"
              >
                <HiChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-1">
                  <HiCalendar className="w-4 h-4" />
                  <span className="font-semibold">
                    Week of {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
                  </span>
                </div>
                {format(weekStart, 'yyyy-MM-dd') !== format(getWeekStart(), 'yyyy-MM-dd') && (
                  <button
                    type="button"
                    onClick={goToCurrentWeek}
                    className="btn btn-link btn-xs text-primary"
                  >
                    Go to current week
                  </button>
                )}
              </div>
              
              <button
                type="button"
                onClick={goToNextWeek}
                className="btn btn-ghost btn-sm btn-circle"
                disabled={format(addWeeks(weekStart, 1), 'yyyy-MM-dd') > format(getWeekStart(), 'yyyy-MM-dd')}
                title="Next week"
              >
                <HiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Alert */}
      {existingReport && (
        <div className="alert alert-info mb-6">
          <HiCheckCircle className="w-5 h-5" />
          <div className="flex-1 flex items-center justify-between gap-4">
            <div>
              <span>You have already submitted a report for this week. You can update it below or </span>
              <button
                type="button"
                onClick={() => router.push(`/bhw/reports/edit?id=${existingReport.id}`)}
                className="btn btn-link btn-sm p-0 h-auto min-h-0 text-info-content underline"
              >
                edit it here
              </button>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/bhw/reports/print?id=${existingReport.id}`)}
              className="btn btn-sm btn-info"
            >
              <HiPrinter className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      )}
      
      {!existingReport && (
        <div className="alert alert-warning mb-6">
          <HiXCircle className="w-5 h-5" />
          <span>No report submitted for this week yet. Please fill out the form below.</span>
        </div>
      )}
      
      {/* Report Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title and Description */}
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
            
            <div className="h-full overflow-y-auto">
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
          {existingReport && (
            <>
              <button
                type="button"
                onClick={() => router.push(`/bhw/reports/print?id=${existingReport.id}`)}
                className="btn btn-outline"
              >
                <HiPrinter className="w-4 h-4" />
                Print Report
              </button>
              <button
                type="button"
                onClick={() => router.push(`/bhw/reports/edit?id=${existingReport.id}`)}
                className="btn btn-outline"
              >
                <HiPencil className="w-4 h-4" />
                Edit Report
              </button>
            </>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving || selectedTasks.length === 0}
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {existingReport ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              existingReport ? 'Update Report' : 'Save Report'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
