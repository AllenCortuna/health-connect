import React, { useEffect, useState } from "react";
import { ProcurementData } from "@/interface/data";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ApprovePendingAccountabilityModalProps {
  open: boolean;
  onClose: () => void;
  item: ProcurementData | null;
  onApprove: (formData: {
    propertyDescription: string;
    propertyItemType: "NE" | "SE";
    propertyNo: string;
    dateAcquired: string;
    fundSource: string;
  }) => Promise<void> | void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export const ApprovePendingAccountabilityModal: React.FC<ApprovePendingAccountabilityModalProps> = ({
  open,
  onClose,
  item,
  onApprove,
  isLoading,
  setIsLoading,
}) => {
  const [propertyDescription, setPropertyDescription] = useState("");
  const [propertyItemType, setPropertyItemType] = useState<"NE" | "SE">("NE");
  const [dateAcquired, setDateAcquired] = useState("");
  const [propertyNo, setPropertyNo] = useState("");
  const [fundSource, setFundSource] = useState("");

  useEffect(() => {
    if (item) {
      setPropertyDescription(item.description || "");
      setPropertyItemType("NE");
      setDateAcquired("");
      setFundSource(item.fundSource || "");
    }
  }, [item]);

  useEffect(() => {
    if (!item || !dateAcquired || !propertyItemType || !fundSource) {
      setPropertyNo("");
      return;
    }
    generatePropertyNo();
    // eslint-disable-next-line
  }, [propertyItemType, dateAcquired, fundSource, item]);

  async function generatePropertyNo() {
    setIsLoading(true);
    try {
      const propertyCol = collection(db, "property");
      const countSnap = await getCountFromServer(propertyCol);
      const nextNumber = (countSnap.data().count + 1)
        .toString()
        .padStart(4, "0");
      const prefix = propertyItemType;
      const year = new Date(dateAcquired)
        .getFullYear()
        .toString()
        .slice(-2);
      const generated = `${prefix}-${year}-${fundSource}-${nextNumber}`;
      setPropertyNo(generated);
    } catch (e) {
      setPropertyNo("");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove() {
    if (!propertyNo || !propertyDescription || !dateAcquired || !fundSource) return;
    setIsLoading(true);
    await onApprove({
      propertyDescription,
      propertyItemType,
      propertyNo,
      dateAcquired,
      fundSource,
    });
    setIsLoading(false);
  }

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 btn btn-xs btn-circle"
          onClick={onClose}
          disabled={isLoading}
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-5">
          {" "}
          <span className="font-bold text-sm text-zinc-600">Approve</span>{" "}
          <span className="font-extrabold underline text-primary">{propertyNo}</span>
        </h2>
        <div className="form-control mb-6">
          <label className="label">Property Description</label>
          <textarea
            className="textarea textarea-bordered min-h-[80px] w-full"
            value={propertyDescription}
            onChange={(e) => setPropertyDescription(e.target.value)}
          />
        </div>
        <div className="form-control mb-6">
          <label className="label">Fund Source</label>
          <input
            className="input input-bordered w-full"
            value={fundSource}
            onChange={(e) => setFundSource(e.target.value)}
          />
        </div>
        <div className="form-control mb-6">
          <label className="label">Property Item Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={propertyItemType === "NE"}
                onChange={() => setPropertyItemType("NE")}
                className="checkbox checkbox-primary"
                disabled={isLoading}
              />
              <span>NE</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={propertyItemType === "SE"}
                onChange={() => setPropertyItemType("SE")}
                className="checkbox checkbox-primary"
                disabled={isLoading}
              />
              <span>SE</span>
            </label>
          </div>
        </div>
        <div className="form-control mb-6">
          <label className="label">Date Acquired</label>
          <input
            className="input input-bordered w-full"
            type="date"
            value={dateAcquired}
            onChange={(e) => setDateAcquired(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApprove}
            disabled={
              !propertyNo ||
              !propertyDescription ||
              !dateAcquired ||
              !fundSource ||
              isLoading
            }
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              "Approve"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovePendingAccountabilityModal;
