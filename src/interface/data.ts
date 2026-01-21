export interface Medicine {
    id: string;
    medCode: string;
    quantity: number;
    expDate: Date;
    name: string;
    description?: string;
    medType: 'tablet' | 'capsule' | 'syrup' | 'inhaler' | 'ointment' | 'injection' | 'drops';
    category: string;
    dosageForm: string;
    barangay?: string; //barangay kung saan na release ang medicine
    status: 'available' | 'out of stock';
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    id: string;
    message: string;
    createdAt: string;
    updatedAt: string;
    senderName: string;
    receiverName: string;
    status: 'read' | 'unread';
    attachment: string;
    senderId: string;
    receiverId: string;
}


export interface Announcement{
    id: string;
    createdBy: string; //BHW name
    createdById: string; //BHW id
    title: string;
    content: string;
    date: string;
    time: string;
    createdAt: string;
    updatedAt: string;
    important: boolean;
}

export interface MonthlyReport {
    id: string;
    bhwId: string;
    bhwName: string;
    reportDate: string;
    reportType: 'monthly' | 'weekly';
    contents: [string]; // link to uploaded file in Firebase Storage
    createdAt: string;
    updatedAt: string;
    barangay: string;
}