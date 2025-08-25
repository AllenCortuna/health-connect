import React, { useState } from "react";

interface RejectPendingModalProps {
  open: boolean;
  onClose: () => void;
  onReject: (remarks: string) => void;
}

const RejectPendingModal: React.FC<RejectPendingModalProps> = ({ open, onClose, onReject }) => {
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleReject() {
    if (!remarks.trim()) return;
    setIsSubmitting(true);
    onReject(remarks.trim());
    setRemarks("");
    setIsSubmitting(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 btn btn-xs btn-circle"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-5 text-error">Reject Item</h2>
        <div className="form-control mb-6">
          <label className="label">Remarks (reason for rejection)</label>
          <textarea
            className="textarea textarea-bordered min-h-[80px] w-full"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Enter reason for rejection..."
          />
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-error"
            onClick={handleReject}
            disabled={!remarks.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              "Reject"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectPendingModal; 