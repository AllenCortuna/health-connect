'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import type { Household } from '@/interface/user'
import { useRouter } from 'next/navigation'
import { useAccountStore } from '@/store/accountStore'
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import * as XLSX from 'xlsx'
import { successToast, errorToast } from '@/lib/toast'
import { HiArrowLeft } from 'react-icons/hi'

function getNumericPart(householdNumber: string): number | null {
  const parts = householdNumber.split('-')
  if (parts.length > 1) {
    const num = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(num)) return num
  }
  const num = parseInt(householdNumber, 10)
  return !isNaN(num) ? num : null
}

function sortHouseholds(a: Household, b: Household): number {
  const numA = getNumericPart(a.householdNumber)
  const numB = getNumericPart(b.householdNumber)
  if (numA !== null && numB !== null) return numA - numB
  if (numA !== null) return -1
  if (numB !== null) return 1
  return a.householdNumber.localeCompare(b.householdNumber)
}

export default function ExportHouseholdPage() {
  const router = useRouter()
  const { account } = useAccountStore()
  const [password, setPassword] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (account?.role !== 'bhw') {
      router.replace('/bhw/household')
    }
  }, [account?.role, router])

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (!password.trim()) {
      setPasswordError('Please enter your password.')
      return
    }

    const user = auth.currentUser
    if (!user?.email) {
      errorToast('You must be logged in to export.')
      return
    }

    setIsExporting(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)
    } catch (error: unknown) {
      setIsExporting(false)
      const code = (error as { code?: string }).code
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError('Incorrect password. Please try again.')
      } else {
        errorToast('Verification failed. Please try again.')
      }
      return
    }

    try {
      const householdsRef = collection(db, 'household')
      const snapshot = await getDocs(householdsRef)

      const householdsData: Household[] = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        householdsData.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() ?? data.createdAt
        } as Household)
      })

      householdsData.sort(sortHouseholds)

      const rows = householdsData.map((h) => ({
        'Household Number': h.householdNumber ?? '',
        'Head of Household': h.headOfHousehold ?? '',
        Address: h.address ?? '',
        'Total Members': h.totalMembers ?? 0,
        'Total Family': h.totalFamily ?? 0,
        'Contact Number': h.headOfHouseholdContactNumber ?? '',
        Email: h.email ?? ''
      }))

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Households')

      const fileName = `households_export_${new Date().toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(workbook, fileName)

      successToast(`Exported ${householdsData.length} households to ${fileName}`)
      setPassword('')
      router.push('/bhw/household')
    } catch (err) {
      console.error('Export error:', err)
      errorToast('Failed to export households. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (account?.role !== 'bhw') {
    return null
  }

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => router.push('/bhw/household')}
          className="btn btn-ghost btn-circle btn-sm"
          aria-label="Back"
        >
          <HiArrowLeft className="w-5 h-5 text-secondary" />
        </button>
        <h1 className="text-2xl font-bold text-secondary">Export Households</h1>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <p className="text-sm text-gray-600 mb-4">
            Export all household data to an Excel file (xlsx). You must enter your account password to continue.
          </p>

          <form onSubmit={handleExport} className="space-y-4">
            <div className="form-control">
              <label className="label" htmlFor="export-password">
                <span className="label-text font-semibold">Your password</span>
              </label>
              <input
                id="export-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError('')
                }}
                placeholder="Enter your password"
                className={`input input-bordered w-full ${passwordError ? 'input-error' : ''}`}
                disabled={isExporting}
                autoComplete="current-password"
              />
              {passwordError && (
                <label className="label">
                  <span className="label-text-alt text-error">{passwordError}</span>
                </label>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push('/bhw/household')}
                className="btn btn-outline flex-1"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-secondary flex-1"
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Exporting...
                  </>
                ) : (
                  'Verify & Export to Excel'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
