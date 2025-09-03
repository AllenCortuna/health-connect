// Add this helper before the component
export function removeUndefinedFields<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
}

// Helper function to construct full name from name parts
export function constructFullName(firstName: string, middleName?: string, lastName?: string, suffix?: string): string {
  const nameParts = [firstName, middleName, lastName, suffix].filter(part => part && part.trim() !== '');
  return nameParts.join(' ');
}