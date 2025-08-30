import React from 'react'

interface StatusBadgeProps {
  status: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'xs' }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      // Resident statuses
      case 'child':
        return 'badge badge-primary whitespace-nowrap'
      case 'adult':
        return 'badge badge-success whitespace-nowrap'
      case 'senior':
        return 'badge badge-warning whitespace-nowrap'
      case 'pwd':
        return 'badge badge-error whitespace-nowrap'
      case 'pregnant':
        return 'badge badge-info whitespace-nowrap'
      
      // BHW statuses
      case 'single':
        return 'badge badge-primary whitespace-nowrap'
      case 'married':
        return 'badge badge-success whitespace-nowrap'
      case 'widowed':
        return 'badge badge-warning whitespace-nowrap'
      case 'separated':
        return 'badge badge-error whitespace-nowrap'
      case 'divorced':
        return 'badge badge-info whitespace-nowrap'
      
      default:
        return 'badge badge-ghost whitespace-nowrap'
    }
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
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default StatusBadge
