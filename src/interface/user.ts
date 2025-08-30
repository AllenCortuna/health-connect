export interface Account {
    id: string;
    username: string;
    email: string;
    password?: string;
    createdAt?: Date | { toDate: () => Date };
    role: 'admin' | 'bhw' | 'resident';
    name?: string;
    officeName?: string;
    officeFullName?: string;
    officeAddress?: string;
    officeContactNumber?: string;
    preparedBy?: string;
    preparedByPosition?: string;
    notedBy?: string;
    notedByPosition?: string;
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
    email: string;
    createdAt?: Date | { toDate: () => Date };
    height?: number;
    weight?: number;
    bloodType?: string;
    houseNo?: string;
    spouseName?: string;
}