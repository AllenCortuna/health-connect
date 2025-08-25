import React from 'react';
import { ProcurementData } from '@/interface/data';
import { HiExclamationTriangle } from 'react-icons/hi2';

interface DataTableProps {
  parsedData: ProcurementData[];
  onEditField: (index: number, field: keyof ProcurementData, value: string | number | 'NE/SE' | 'E') => void;
}

const DataTable: React.FC<DataTableProps> = ({ parsedData, onEditField }) => {
  const itemsWithoutType = parsedData.filter(item => !item.itemType);
  
  return (
    <div className="bg-white rounded-lg w-full shadow-md p-6 mb-6">
      {itemsWithoutType.length > 0 && (
        <div className="alert alert-error mb-4 ml-0 mr-auto w-fit text-xs text-white">
          <HiExclamationTriangle className="stroke-current shrink-0 h-4 w-4" />
          <span className="text-xs drop-shadow">Please select item type for {itemsWithoutType.length} item(s) before uploading</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full text-xs">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th>Item Type</th>
              <th>Item Code</th>
              <th>Description</th>
              <th>Unit</th>
              <th>Qty</th>
              <th>Balance Qty</th>
              <th>Project Name</th>
              <th>Project Ref No</th>
              <th>Office</th>
              <th>Fund Source</th>
              <th>PR Date</th>
              <th>PR Item No</th>
              <th>PR Unit Price</th>
              <th>PR Total Amount</th>
              <th>PO Unit Price</th>
              <th>PO Total Amount</th>
              <th>Supplier</th>
              <th>Delivery Receipt No</th>
              <th>Delivery Receipt Date</th>
              <th>PO NO</th>
              <th>PO Date</th>
              <th>AIR No</th>
              <th>AIR Date</th>
              <th>RIS Inquiry No</th>
              <th>RIS Inquiry Date</th>
              <th>RIS Issued No</th>
              <th>RIS Issued Date</th>
              <th>PAR ICS No</th>
              <th>PAR ICS Date</th>
              <th>Accountable Person</th>
              <th>Mode Of Procurement</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {parsedData.map((item, index) => (
              <tr key={index} className={`hover:bg-base-100 ${!item.itemType ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}>
                <td>
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`itemType-${index}`}
                        value="NE/SE"
                        checked={item.itemType === 'NE/SE'}
                        onChange={e => onEditField(index, 'itemType', e.target.value as 'NE/SE' | 'E')}
                        className="radio radio-xs radio-primary"
                        required
                      />
                      <span className="text-xs">NE/SE</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`itemType-${index}`}
                        value="E"
                        checked={item.itemType === 'E'}
                            onChange={e => onEditField(index, 'itemType', e.target.value as 'NE/SE' | 'E')}
                        className="radio radio-xs radio-primary"
                        required
                      />
                      <span className="text-xs">E</span>
                    </label>
                  </div>
                </td>
                <td>
                  <input
                    className="input input-xs w-24 font-mono"
                    value={item.itemCode}
                    onChange={e => onEditField(index, 'itemCode', e.target.value)}
                    required
                  />
                </td>
                <td>
                    <div className="tooltip tooltip-top" data-tip={item.description}>
                        <input
                            className="input input-xs w-60"
                            value={item.description}
                            onChange={e => onEditField(index, 'description', e.target.value)}
                            required
                        />
                    </div>
                </td>
                <td>
                  <input
                    className="input input-xs w-16"
                    value={item.unitOfMeasure}
                    onChange={e => onEditField(index, 'unitOfMeasure', e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-16"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e => onEditField(index, 'quantity', Number(e.target.value))}
                    required
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-16"
                    type="number"
                    min={0}
                    value={item.balanceQuantity}
                    onChange={e => onEditField(index, 'balanceQuantity', Number(e.target.value))}
                    required
                  />
                </td>
                <td>
                    <div className="tooltip tooltip-top" data-tip={item.projectName}>
                        <input
                            className="input input-xs w-60"
                            value={item.projectName || ''}
                            onChange={e => onEditField(index, 'projectName', e.target.value)}
                        />
                    </div>
                </td>
                <td>
                  <input
                    className="input input-xs w-24 font-mono"
                    value={item.projectRefNo || ''}
                    onChange={e => onEditField(index, 'projectRefNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-20"
                    value={item.office || ''}
                    onChange={e => onEditField(index, 'office', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs max-w-24"
                    value={item.fundSource || ''}
                    onChange={e => onEditField(index, 'fundSource', e.target.value)}
                    title={item.fundSource}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-32"
                    type="date"
                    value={item.prDate || ''}
                    onChange={e => onEditField(index, 'prDate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-16"
                    value={item.prItemNo || ''}
                    onChange={e => onEditField(index, 'prItemNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-20 text-right"
                    type="number"
                    min={0}
                    value={item.prUnitPrice ?? ''}
                    onChange={e => onEditField(index, 'prUnitPrice', e.target.value ? Number(e.target.value) : '')}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-20 text-right"
                    type="number"
                    min={0}
                    value={item.prTotalAmount ?? ''}
                    onChange={e => onEditField(index, 'prTotalAmount', e.target.value ? Number(e.target.value) : '')}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-20 text-right"
                    type="number"
                    min={0}
                    value={item.poUnitPrice ?? ''}
                    onChange={e => onEditField(index, 'poUnitPrice', e.target.value ? Number(e.target.value) : '')}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-20 text-right"
                    type="number"
                    min={0}
                    value={item.poTotalAmount ?? ''}
                    onChange={e => onEditField(index, 'poTotalAmount', e.target.value ? Number(e.target.value) : '')}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs max-w-32"
                    value={item.supplier || ''}
                    onChange={e => onEditField(index, 'supplier', e.target.value)}
                    title={item.supplier}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs max-w-24"
                    value={item.deliveryReceiptNo || ''}
                    onChange={e => onEditField(index, 'deliveryReceiptNo', e.target.value)}
                    title={item.deliveryReceiptNo}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-32"
                    type="date"
                    value={item.deliveryReceiptDate || ''}
                    onChange={e => onEditField(index, 'deliveryReceiptDate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-24 font-mono"
                    value={item.poNo || ''}
                    onChange={e => onEditField(index, 'poNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-32"
                    type="date"
                    value={item.poDate || ''}
                    onChange={e => onEditField(index, 'poDate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-24 font-mono"
                    value={item.airNo || ''}
                    onChange={e => onEditField(index, 'airNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-32"
                    type="date"
                    value={item.airDate || ''}
                    onChange={e => onEditField(index, 'airDate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-24 font-mono"
                    value={item.risInquiryNo || ''}
                    onChange={e => onEditField(index, 'risInquiryNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-32"
                    type="date"
                    value={item.risInquiryDate || ''}
                    onChange={e => onEditField(index, 'risInquiryDate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-24 font-mono"
                    value={item.risIssuedNo || ''}
                    onChange={e => onEditField(index, 'risIssuedNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-32"
                    type="date"
                    value={item.risIssuedDate || ''}
                    onChange={e => onEditField(index, 'risIssuedDate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-24 font-mono"
                    value={item.parIcsNo || ''}
                    onChange={e => onEditField(index, 'parIcsNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-32"
                    type="date"
                    value={item.parIcsDate || ''}
                    onChange={e => onEditField(index, 'parIcsDate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs max-w-36"
                    value={item.accountablePerson || ''}
                    onChange={e => onEditField(index, 'accountablePerson', e.target.value)}
                    title={item.accountablePerson}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs max-w-40"
                    value={item.modeOfProcurement || ''}
                    onChange={e => onEditField(index, 'modeOfProcurement', e.target.value)}
                    title={item.modeOfProcurement}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs w-20"
                    value={item.status || ''}
                    onChange={e => onEditField(index, 'status', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input input-xs max-w-24"
                    value={item.remarks || ''}
                    onChange={e => onEditField(index, 'remarks', e.target.value)}
                    title={item.remarks}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable; 