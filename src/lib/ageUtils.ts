/**
 * Age calculation utilities for resident management
 */

/**
 * Calculate age in months from birth date
 * @param birthDate - The birth date
 * @returns Age in months (0 or positive)
 */
export function getAgeInMonths(birthDate: Date): number {
  const today = new Date()
  const years = today.getFullYear() - birthDate.getFullYear()
  const months = today.getMonth() - birthDate.getMonth()
  const days = today.getDate() - birthDate.getDate()
  
  let totalMonths = years * 12 + months
  if (days < 0) totalMonths--
  
  return Math.max(0, totalMonths)
}

/**
 * Get age-based status (newborn, infant, toddler, child, adult, senior)
 * Preserves pwd and pregnant statuses
 * @param birthDate - The birth date
 * @param originalStatus - The original status from database
 * @returns Age-based status or original status if pwd/pregnant
 */
export function getAgeBasedStatus(birthDate: Date | undefined, originalStatus: string): string {
  if (!birthDate || !(birthDate instanceof Date)) return originalStatus
  
  // Don't override pwd or pregnant status
  if (originalStatus === 'pwd' || originalStatus === 'pregnant') {
    return originalStatus
  }
  
  const months = getAgeInMonths(birthDate)
  const years = Math.floor(months / 12)
  
  if (months < 2) {
    return 'newborn'
  } else if (months < 12) {
    return 'infant'
  } else if (years < 4) {
    return 'toddler'
  } else if (years < 18) {
    return 'child'
  } else if (years < 60) {
    return 'adult'
  } else {
    return 'senior'
  }
}

/**
 * Get age category for dashboard statistics
 * @param birthDate - The birth date
 * @returns Age category string or null if invalid date
 */
export function getAgeCategory(birthDate: Date | undefined): string | null {
  if (!birthDate || !(birthDate instanceof Date)) return null
  
  const months = getAgeInMonths(birthDate)
  const years = Math.floor(months / 12)
  
  if (months < 2) {
    return 'newborn'
  } else if (months < 12) {
    return 'infant'
  } else if (years < 4) {
    return 'toddler'
  } else if (years < 18) {
    return 'child'
  } else if (years < 60) {
    return 'adult'
  } else {
    return 'senior'
  }
}

/**
 * Get simplified status for Resident.status field (child, adult, senior)
 * Used when updating resident records
 * @param birthDate - The birth date
 * @returns Simplified status: 'child', 'adult', or 'senior'
 */
export function getStatusFromAge(birthDate: Date): 'child' | 'adult' | 'senior' {
  const months = getAgeInMonths(birthDate)
  const years = Math.floor(months / 12)
  
  if (years < 18) return 'child'
  if (years < 60) return 'adult'
  return 'senior'
}

/**
 * Format age for display (e.g., "5 mo", "3 yr")
 * @param birthDate - The birth date
 * @returns Formatted age string or 'N/A' if invalid
 */
export function getAgeDisplay(birthDate: Date | undefined): string {
  if (!birthDate || !(birthDate instanceof Date)) return 'N/A'
  
  const months = getAgeInMonths(birthDate)
  const years = Math.floor(months / 12)
  
  if (months < 12) {
    return `${months} mo`
  } else if (years < 4) {
    return `${years} yr`
  } else {
    return `${years} yr`
  }
}
