import React from 'react'

interface StatusBadgeProps {
  status: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'xs' }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      // Resident statuses - age-based
      case 'newborn':
        return 'badge badge-accent whitespace-nowrap text-[10px]'
      case 'infant':
        return 'badge badge-info whitespace-nowrap text-[10px]'
      case 'toddler':
        return 'badge badge-primary whitespace-nowrap text-[10px]'
      case 'child':
        return 'badge badge-primary whitespace-nowrap text-[10px]'
      case 'adult':
        return 'badge badge-success whitespace-nowrap text-[10px]'
      case 'senior':
        return 'badge badge-warning whitespace-nowrap text-[10px]'
      case 'pwd':
        return 'badge badge-error whitespace-nowrap text-[10px]'
      case 'pregnant':
        return 'badge badge-info whitespace-nowrap text-[10px]'
      
      // BHW statuses
      case 'single':
        return 'badge badge-primary whitespace-nowrap text-[10px]'
      case 'married':
        return 'badge badge-success whitespace-nowrap text-[10px]'
      case 'widowed':
        return 'badge badge-warning whitespace-nowrap text-[10px]'
      case 'separated':
        return 'badge badge-error whitespace-nowrap text-[10px]'
      case 'divorced':
        return 'badge badge-info whitespace-nowrap text-[10px]'
      
      default:
        return 'badge badge-neutral whitespace-nowrap text-[10px]'
    }
  }

  const formatStatusText = (status: string) => {
    const lowerStatus = status.toLowerCase()
    // Handle special cases
    if (lowerStatus === 'pwd') return 'PWD'
    // Capitalize first letter, rest lowercase
    return lowerStatus.charAt(0).toUpperCase() + lowerStatus.slice(1)
  }

  const getStatusSize = (size: string) => {
    switch (size) {
      case 'xs':
        return 'badge-xs'
      case 'sm':
        return 'badge-sm'
      case 'md':
        return 'badge-md'
      case 'lg':
        return 'badge-lg'
      default:
        return 'badge-xs'
    }
  }

  return (
    <span className={`${getStatusColor(status)} ${getStatusSize(size)}`}>
      {formatStatusText(status)}
    </span>
  )
}

export default StatusBadge
