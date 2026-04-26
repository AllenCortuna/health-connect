import React from 'react'
import { render, screen } from '@testing-library/react'
import ReportsPage from './page'

jest.mock('next/link', () => {
  return function LinkMock({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

describe('Reports page', () => {
  it('renders report options and dashboard navigation links', () => {
    render(<ReportsPage />)

    expect(screen.getByRole('heading', { name: /Reports Management/i })).toBeInTheDocument()
    expect(
      screen.getByText(
        /Access comprehensive reports, summaries, and analytics for reports management/i
      )
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Monthly Reports/i })).toHaveAttribute(
      'href',
      '/admin/reports/monthly'
    )
    expect(screen.getByRole('link', { name: /Weekly Reports/i })).toHaveAttribute(
      'href',
      '/admin/reports/weekly'
    )
    expect(screen.getByRole('link', { name: /Back to Dashboard/i })).toHaveAttribute(
      'href',
      '/admin/dashboard'
    )
  })
})
