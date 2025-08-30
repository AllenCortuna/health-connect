export interface Medicine {
    id: string;
    medCode: string;
    quantity: number;
    expDate: Date;
    name: string;
    description: string;
    medType: 'tablet' | 'capsule' | 'syrup' | 'inhaler' | 'ointment' | 'injection' | 'drops';
    category: string;
    supplier: string;
    status: 'available' | 'out of stock';
    createdAt: Date;
    updatedAt: Date;
}