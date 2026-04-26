import React from 'react'
import { render, screen } from '@testing-library/react'
import LoginPage from './page'

jest.mock('next/image', () => {
  return function ImageMock(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? ''} />
  }
})

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

describe('Login page', () => {
  it('renders landing content and account action links', () => {
    render(<LoginPage />)

    expect(screen.getByText('Barangay Health Connect')).toBeInTheDocument()
    expect(screen.getByText(/How will you connect today\?/i)).toBeInTheDocument()
    expect(screen.getByText('Access Your Account')).toBeInTheDocument()
    expect(screen.getByText('Need an Account?')).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: /Household Login/i })
    ).toHaveAttribute('href', '/login/resident')
    expect(
      screen.getByRole('link', { name: /BHW \/ Admin Login/i })
    ).toHaveAttribute('href', '/login/bhw-admin')
    expect(
      screen.getByRole('link', { name: /Household Sign Up/i })
    ).toHaveAttribute('href', '/sign-up/resident')
    expect(screen.getByRole('link', { name: /BHW Sign Up/i })).toHaveAttribute(
      'href',
      '/sign-up/bhw'
    )
  })
})
