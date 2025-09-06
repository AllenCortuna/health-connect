export interface Account {
    id: string;
    email: string;
    password?: string;
    createdAt?: Date | { toDate: () => Date };
    role: 'admin' | 'bhw' | 'resident';
    name?: string;
    contactNumber?: string;
    address?: string;
}

export interface Resident {
    id: string;
    idNo: string;
    fullName: string;
    firstName: string;
    middleName: string;
    lastName: string;
    suffix?: string;
    birthDate: Date;
    birthPlace: string;
    address: string;
    gender: 'male' | 'female';
    status: 'child' | 'adult' | 'senior' | 'pwd' | 'pregnant';
    contactNumber?: string;
    email?: string;
    createdAt?: Date | { toDate: () => Date };
    height?: number;
    weight?: number;
    bloodType?: string;
    houseNo?: string;
    spouseName?: string;
}

export interface BHW{
    id: string;
    email?: string;
    name?: string;
    contactNumber?: string;
    address?: string;
    birthDate: string;
    gender: 'male' | 'female';
    status: 'single' | 'married' | 'widowed' | 'separated' | 'divorced';
    createdAt?: Date | { toDate: () => Date };
}