'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import type { Resident } from '@/interface/user'
import { useRouter } from 'next/navigation'
import { useAccountStore } from '@/store/accountStore'
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import * as XLSX from 'xlsx'
import { successToast, errorToast } from '@/lib/toast'
import { getAgeBasedStatus, getAgeDisplay } from '@/lib/ageUtils'
import { HiArrowLeft } from 'react-icons/hi'

const AGE_STATUSES = new Set(['newborn', 'infant', 'toddler', 'child', 'adult', 'senior'])

function formatMarginalizedGroups(groups: string[] | undefined): string {
  if (!groups?.length) return '—'
  const filtered = groups.filter((g) => !AGE_STATUSES.has(g.toLowerCase()))
  if (filtered.length === 0) return '—'
  return filtered
    .map((g) => {
      if (g === 'IPs') return "IP's"
      if (g === '4ps') return '4Ps'
      if (g === 'pwd') return 'PWD'
      if (g === 'solo parent') return 'Solo Parent'
      return g.charAt(0).toUpperCase() + g.slice(1)
    })
    .join(', ')
}

function formatDate(value: Date | { toDate?: () => Date } | undefined): string {
  if (!value) return 'N/A'
  const d = value instanceof Date ? value : typeof (value as { toDate?: () => Date }).toDate === 'function' ? (value as { toDate: () => Date }).toDate() : null
  return d ? d.toLocaleDateString() : 'N/A'
}

export default function ExportResidentPage() {
  const router = useRouter()
  const { account } = useAccountStore()
  const [password, setPassword] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (account?.role !== 'bhw') {
      router.replace('/bhw/resident')
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
      const residentsRef = collection(db, 'resident')
      const q = query(residentsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      const residentsData: Resident[] = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        residentsData.push({
          id: docSnap.id,
          ...data,
          birthDate: data.birthDate?.toDate?.() ?? data.birthDate,
          createdAt: data.createdAt?.toDate?.() ?? data.createdAt
        } as Resident)
      })

      const rows = residentsData.map((r) => {
        let birthDate: Date | undefined
        if (r.birthDate instanceof Date) {
          birthDate = r.birthDate
        } else if (r.birthDate && typeof (r.birthDate as { toDate?: () => Date }).toDate === 'function') {
          birthDate = (r.birthDate as { toDate: () => Date }).toDate()
        } else if (r.birthDate) {
          birthDate = new Date(r.birthDate as unknown as string | number)
        }
        return {
          Name: r.fullName ?? '',
          'Household Number': r.householdId ?? '',
          'Family No': r.familyNo ?? '',
          Age: getAgeDisplay(birthDate),
          Status: getAgeBasedStatus(birthDate, r.marginalizedGroup?.find((g) => ['child', 'adult', 'senior', 'pwd', 'pregnant'].includes(g)) ?? ''),
          Gender: r.gender ? String(r.gender).charAt(0).toUpperCase() + String(r.gender).slice(1) : '',
          'Marginalized Group': formatMarginalizedGroups(r.marginalizedGroup),
          'Active Status': r.activeStatus ?? true ? 'Active' : 'Inactive',
          'Contact Number': r.contactNumber ?? '',
          Email: r.email ?? '',
          'Birth Date': formatDate(r.birthDate),
          Address: r.address ?? '',
          'Birth Place': r.birthPlace ?? ''
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Residents')

      const fileName = `residents_export_${new Date().toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(workbook, fileName)

      successToast(`Exported ${residentsData.length} residents to ${fileName}`)
      setPassword('')
      router.push('/bhw/resident')
    } catch (err) {
      console.error('Export error:', err)
      errorToast('Failed to export residents. Please try again.')
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
          onClick={() => router.push('/bhw/resident')}
          className="btn btn-ghost btn-circle btn-sm"
          aria-label="Back"
        >
          <HiArrowLeft className="w-5 h-5 text-secondary" />
        </button>
        <h1 className="text-2xl font-bold text-secondary">Export Residents</h1>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <p className="text-sm text-gray-600 mb-4">
            Export all resident data to an Excel file (xlsx). You must enter your account password to continue.
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
                onClick={() => router.push('/bhw/resident')}
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
