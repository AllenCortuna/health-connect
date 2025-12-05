export interface Account {
    id: string;
    email: string;
    password?: string;
    createdAt?: Date | { toDate: () => Date };
    role: 'admin' | 'bhw' | 'household';
    name?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    suffix?: string;
    contactNumber?: string;
    address?: string;
    headOfHousehold?: string;
    profilePicture?: string;
}

export interface Household {
    id: string;
    householdNumber: string;
    address: string;
    createdAt?: string;
    totalMembers: number;
    totalFamily: number;
    headOfHousehold: string;
    email: string;
    headOfHouseholdContactNumber: string;
}

export interface Resident {
    id: string;
    householdId: string;
    role: 'household';
    familyNo: string;
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
    profilePicture?: string; // URL of the profile picture in Firebase Storage
}