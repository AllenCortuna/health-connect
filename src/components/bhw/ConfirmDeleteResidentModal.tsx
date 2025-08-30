import React, { useState } from 'react'
import type { Resident } from '@/interface/user'
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa'

interface ConfirmDeleteResidentModalProps {
  resident: Resident | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

const ConfirmDeleteResidentModal: React.FC<ConfirmDeleteResidentModalProps> = ({ 
  resident, 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting 
}) => {
  const [confirmationId, setConfirmationId] = useState('')
  const [error, setError] = useState('')

  if (!isOpen || !resident) return null

  const handleConfirm = () => {
    if (confirmationId.trim() === resident.idNo) {
      onConfirm()
    } else {
      setError('ID Number does not match. Please try again.')
    }
  }

  const handleClose = () => {
    setConfirmationId('')
    setError('')
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationId(e.target.value)
    if (error) setError('')
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="text-error text-xl" />
          </div>
          <h3 className="font-extrabold text-lg text-error">Delete Resident</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-base-200 p-4 rounded-lg">
            <p className="text-xs text-gray-700 mb-2">
              You are about to delete the following resident:
            </p>
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {resident.firstName} {resident.middleName} {resident.lastName} {resident.suffix}
              </p>
              <p className="text-xs text-gray-600">ID: {resident.idNo}</p>
            </div>
          </div>

          <div className="alert alert-warning">
            <FaExclamationTriangle />
            <span className="text-xs">
              This action cannot be undone. All resident data will be permanently deleted.
            </span>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-xs mb-4">
                Type the resident&apos;s ID Number to confirm: <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              value={confirmationId}
              onChange={handleInputChange}
              className={`input input-bordered ${error ? 'input-error' : ''}`}
              placeholder={`Enter: ${resident.idNo}`}
              disabled={isDeleting}
            />
            {error && (
              <span className="label-text-alt text-error">{error}</span>
            )}
          </div>
        </div>

        <div className="modal-action">
          <button
            onClick={handleClose}
            className="btn btn-outline btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-error"
            disabled={isDeleting || confirmationId.trim() !== resident.idNo}
          >
            {isDeleting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="mr-2" />
                Delete Resident
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteResidentModal
