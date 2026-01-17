'use client'

import React, { useState, useEffect } from 'react'
import type { Medicine } from '@/interface/data'
import { FaTimes } from 'react-icons/fa'
import { barangay } from '@/constant/barangay'

interface ReleaseMedicineModalProps {
  medicine: Medicine | null
  isOpen: boolean
  onClose: () => void
  onRelease: (amount: number, date: Date, remarks: string, barangay: string) => Promise<void>
  isReleasing: boolean
}

export default function ReleaseMedicineModal({
  medicine,
  isOpen,
  onClose,
  onRelease,
  isReleasing
}: ReleaseMedicineModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [remarks, setRemarks] = useState<string>('')
  const [selectedBarangay, setSelectedBarangay] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && medicine) {
      // Set default date to today
      const today = new Date()
      setDate(today.toISOString().split('T')[0])
      setAmount('')
      setRemarks('')
      setSelectedBarangay('')
      setErrors({})
    }
  }, [isOpen, medicine])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Amount validation
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    } else if (amountNum > (medicine?.quantity || 0)) {
      newErrors.amount = `Cannot release more than remaining quantity (${medicine?.quantity || 0})`
    }

    // Date validation
    if (!date) {
      newErrors.date = 'Date is required'
    } else {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      selectedDate.setHours(0, 0, 0, 0)
      
      if (selectedDate > today) {
        newErrors.date = 'Release date cannot be in the future'
      }
    }

    // Barangay validation
    if (!selectedBarangay || selectedBarangay.trim() === '') {
      newErrors.barangay = 'Barangay is required'
    }

    // Check if medicine is expired
    if (medicine?.expDate instanceof Date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const expDate = new Date(medicine.expDate)
      expDate.setHours(0, 0, 0, 0)
      
      if (expDate <= today) {
        newErrors.expired = 'Cannot release expired medicine'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !medicine) return

    const releaseDate = new Date(date)
    await onRelease(parseFloat(amount), releaseDate, remarks, selectedBarangay)
    
    // Reset form
    setAmount('')
    setRemarks('')
    setSelectedBarangay('')
    setDate(new Date().toISOString().split('T')[0])
    setErrors({})
  }

  const handleClose = () => {
    setAmount('')
    setRemarks('')
    setSelectedBarangay('')
    setDate(new Date().toISOString().split('T')[0])
    setErrors({})
    onClose()
  }

  if (!isOpen || !medicine) return null

  const isExpired = medicine.expDate instanceof Date && 
    new Date(medicine.expDate) <= new Date()

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-secondary">Release Medicine</h3>
          <button
            onClick={handleClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={isReleasing}
          >
            <FaTimes />
          </button>
        </div>

        {/* Medicine Info */}
        <div className="card bg-base-200 mb-4">
          <div className="card-body p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Code:</span> {medicine.medCode}
              </div>
              <div>
                <span className="font-semibold">Name:</span> {medicine.name}
              </div>
              <div>
                <span className="font-semibold">Available Quantity:</span>{' '}
                <span className={`font-bold ${medicine.quantity <= 10 ? 'text-error' : 'text-success'}`}>
                  {medicine.quantity}
                </span>
              </div>
              <div>
                <span className="font-semibold">Expiry Date:</span>{' '}
                <span className={isExpired ? 'text-error font-bold' : ''}>
                  {medicine.expDate instanceof Date 
                    ? medicine.expDate.toLocaleDateString() 
                    : 'N/A'}
                  {isExpired && ' (EXPIRED)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {errors.expired && (
          <div className="alert alert-error mb-4">
            <span>{errors.expired}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control flex flex-col">
            <label className="label">
              <span className="label-text font-semibold">Quantity to Release *</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }))
              }}
              className={`input input-bordered ${errors.amount ? 'input-error' : ''}`}
              placeholder="Enter quantity to release"
              min="1"
              max={medicine.quantity}
              disabled={isReleasing || isExpired}
            />
            {errors.amount && (
              <span className="label-text-alt text-error">{errors.amount}</span>
            )}
            <span className="label-text-alt text-gray-500">
              Maximum: {medicine.quantity} units
            </span>
          </div>

          <div className="form-control flex flex-col">
            <label className="label">
              <span className="label-text font-semibold">Release Date *</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                if (errors.date) setErrors(prev => ({ ...prev, date: '' }))
              }}
              className={`input input-bordered ${errors.date ? 'input-error' : ''}`}
              max={new Date().toISOString().split('T')[0]}
              disabled={isReleasing || isExpired}
            />
            {errors.date && (
              <span className="label-text-alt text-error">{errors.date}</span>
            )}
          </div>

          <div className="form-control flex flex-col">
            <label className="label">
              <span className="label-text font-semibold">Barangay *</span>
            </label>
            <select
              value={selectedBarangay}
              onChange={(e) => {
                setSelectedBarangay(e.target.value)
                if (errors.barangay) setErrors(prev => ({ ...prev, barangay: '' }))
              }}
              className={`select select-bordered ${errors.barangay ? 'select-error' : ''}`}
              disabled={isReleasing || isExpired}
            >
              <option value="" disabled>
                Select Barangay
              </option>
              {barangay.map((brgy) => (
                <option key={brgy} value={brgy}>
                  {brgy}
                </option>
              ))}
            </select>
            {errors.barangay && (
              <span className="label-text-alt text-error">{errors.barangay}</span>
            )}
          </div>

          <div className="form-control flex flex-col">
            <label className="label">
              <span className="label-text font-semibold">Remarks</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="textarea textarea-bordered h-24"
              placeholder="Enter remarks (optional)"
              disabled={isReleasing || isExpired}
            />
          </div>

          <div className="modal-action">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline"
              disabled={isReleasing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={isReleasing || isExpired}
            >
              {isReleasing ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Releasing...
                </>
              ) : (
                'Release Medicine'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  )
}
