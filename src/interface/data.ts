export interface ProcurementData {
    itemCode: string;
    description: string;
    unitOfMeasure: string;
    quantity: number;
    itemType: 'NE/SE' | 'E' | string; // Service/Non-Equipment, Equipment, or empty
    propertyItemType?: 'NE' | 'SE'; // Service/Non-Equipment, Equipment, or empty
    accountabilityStatus?: "pending" | "approved" | "rejected";
    propertyDescription?: string;
    propertyNo?: string;
    propertyLocation?: string;
    year?: string;


    projectName?: string;
    projectRefNo?: string;
    office?: string;
    fundSource?: string;
    prDate?: string;
    prItemNo?: string;
    prUnitPrice?: number;
    prTotalAmount?: number;
    balanceQuantity: number; //update this shit
    poUnitPrice?: number;
    poTotalAmount?: number;
    supplier?: string;
    deliveryReceiptNo?: string;
    deliveryReceiptDate?: string;
    poNo?: string;
    poDate?: string;
    airNo?: string;
    airDate?: string;

    risInquiryNo?: string;
    risInquiryDate?: string;
    risIssuedNo?: string;
    risIssuedDate?: string;
    
    parIcsNo?: string;
    parIcsDate?: string;
    accountablePerson?: string;
    modeOfProcurement?: string;
    status?: string;
    remarks?: string;
}