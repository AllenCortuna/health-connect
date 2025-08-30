import React from 'react'
import type { Medicine } from '@/interface/data'
import { FaExclamationTriangle } from 'react-icons/fa'

interface ConfirmDeleteMedicineModalProps {
  medicine: Medicine | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

const ConfirmDeleteMedicineModal: React.FC<ConfirmDeleteMedicineModalProps> = ({
  medicine,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !medicine) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex items-center gap-3 mb-4">
          <FaExclamationTriangle className="text-error text-xl" />
          <h3 className="font-bold text-lg">Confirm Delete</h3>
        </div>
        
        <div className="py-4">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this medicine?
          </p>
          
          <div className="bg-base-200 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Code:</span>
                <p className="text-gray-700">{medicine.medCode}</p>
              </div>
              <div>
                <span className="font-semibold">Name:</span>
                <p className="text-gray-700">{medicine.name}</p>
              </div>
              <div>
                <span className="font-semibold">Type:</span>
                <p className="text-gray-700 capitalize">{medicine.medType}</p>
              </div>
              <div>
                <span className="font-semibold">Quantity:</span>
                <p className="text-gray-700">{medicine.quantity}</p>
              </div>
            </div>
          </div>
          
          <p className="text-error text-sm font-medium">
            ⚠️ This action cannot be undone. All medicine data will be permanently deleted.
          </p>
        </div>

        <div className="modal-action">
          <button
            onClick={onClose}
            className="btn btn-outline btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-error"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Deleting...
              </>
            ) : (
              'Delete Medicine'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteMedicineModal
