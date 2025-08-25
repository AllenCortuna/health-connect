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