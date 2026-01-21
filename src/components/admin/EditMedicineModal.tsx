'use client'

import React, { useState, useEffect } from 'react'
import type { Medicine } from '@/interface/data'
import { FaTimes } from 'react-icons/fa'

interface EditMedicineModalProps {
  medicine: Medicine | null
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, medCode: string, description: string, medType: Medicine['medType']) => Promise<void>
  isSaving: boolean
}

export default function EditMedicineModal({
  medicine,
  isOpen,
  onClose,
  onSave,
  isSaving
}: EditMedicineModalProps) {
  const [name, setName] = useState<string>('')
  const [medCode, setMedCode] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [medType, setMedType] = useState<Medicine['medType']>('tablet')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && medicine) {
      setName(medicine.name || '')
      setMedCode(medicine.medCode || '')
      setDescription(medicine.description || '')
      setMedType(medicine.medType || 'tablet')
      setErrors({})
    }
  }, [isOpen, medicine])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name?.trim()) {
      newErrors.name = 'Medicine Name is required'
    }

    if (!medCode?.trim()) {
      newErrors.medCode = 'Medicine Code is required'
    }

    // Description is optional

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !medicine) return

    await onSave(name.trim(), medCode.trim(), description.trim(), medType)
    
    // Reset form
    setName('')
    setMedCode('')
    setDescription('')
    setMedType('tablet')
    setErrors({})
  }

  const handleClose = () => {
    setName('')
    setMedCode('')
    setDescription('')
    setMedType('tablet')
    setErrors({})
    onClose()
  }

  if (!isOpen || !medicine) return null

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-secondary">Edit Medicine</h3>
          <button
            onClick={handleClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={isSaving}
          >
            <FaTimes />
          </button>
        </div>

        {/* Medicine Info */}
        <div className="card bg-base-200 mb-4">
          <div className="card-body p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Quantity:</span> {medicine.quantity}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {medicine.status}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Medicine Name *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
              }}
              className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
              placeholder="Enter Medicine Name"
              disabled={isSaving}
            />
            {errors.name && (
              <span className="label-text-alt text-error">{errors.name}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Medicine Code *</span>
            </label>
            <input
              type="text"
              value={medCode}
              onChange={(e) => {
                setMedCode(e.target.value)
                if (errors.medCode) setErrors(prev => ({ ...prev, medCode: '' }))
              }}
              className={`input input-bordered ${errors.medCode ? 'input-error' : ''}`}
              placeholder="Enter Medicine Code"
              disabled={isSaving}
            />
            {errors.medCode && (
              <span className="label-text-alt text-error">{errors.medCode}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Description (Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }))
              }}
              className={`textarea textarea-bordered h-24 ${errors.description ? 'textarea-error' : ''}`}
              placeholder="Enter Description"
              disabled={isSaving}
            />
            {errors.description && (
              <span className="label-text-alt text-error">{errors.description}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Medicine Type *</span>
            </label>
            <select
              value={medType}
              onChange={(e) => setMedType(e.target.value as Medicine['medType'])}
              className="select select-bordered"
              disabled={isSaving}
            >
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="syrup">Syrup</option>
              <option value="inhaler">Inhaler</option>
              <option value="ointment">Ointment</option>
              <option value="injection">Injection</option>
              <option value="drops">Drops</option>
            </select>
          </div>

          <div className="modal-action">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  )
}
