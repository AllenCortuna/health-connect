import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CreateAnnouncement from './page'

const mockPush = jest.fn()
const mockAddDoc = jest.fn()
const mockCollection = jest.fn()
const mockServerTimestamp = jest.fn()
const mockSuccessToast = jest.fn()
const mockErrorToast = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('@/store/accountStore', () => ({
  useAccountStore: () => ({
    account: {
      id: 'bhw-1',
      name: 'BHW Tester',
    },
  }),
}))

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

jest.mock('@/lib/toast', () => ({
  successToast: (...args: unknown[]) => mockSuccessToast(...args),
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
}))

jest.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  serverTimestamp: () => mockServerTimestamp(),
}))

describe('Create announcement page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCollection.mockReturnValue('announcements-collection-ref')
    mockServerTimestamp.mockReturnValue('mock-timestamp')
    mockAddDoc.mockResolvedValue({ id: 'new-announcement-id' })
  })

  it('renders form fields and actions', () => {
    render(<CreateAnnouncement />)

    expect(screen.getByRole('heading', { name: /Create Announcement/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter announcement title/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter announcement content/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Cancel$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Announcement/i })).toBeInTheDocument()
  })

  it('shows validation errors and blocks submission for empty required fields', async () => {
    render(<CreateAnnouncement />)
    const dateInput = document.querySelector('input[name="date"]')
    const timeInput = document.querySelector('input[name="time"]')

    expect(dateInput).not.toBeNull()
    expect(timeInput).not.toBeNull()

    fireEvent.change(screen.getByPlaceholderText(/Enter announcement title/i), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Enter announcement content/i), {
      target: { value: '' },
    })
    fireEvent.change(dateInput as HTMLInputElement, {
      target: { value: '' },
    })
    fireEvent.change(timeInput as HTMLInputElement, {
      target: { value: '' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Create Announcement/i }))

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith('Please fix the errors in the form')
    })

    expect(screen.getByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Content is required')).toBeInTheDocument()
    expect(screen.getByText('Date is required')).toBeInTheDocument()
    expect(screen.getByText('Time is required')).toBeInTheDocument()
    expect(mockAddDoc).not.toHaveBeenCalled()
  })

  it('submits valid data, creates announcement, and redirects', async () => {
    render(<CreateAnnouncement />)
    const dateInput = document.querySelector('input[name="date"]')
    const timeInput = document.querySelector('input[name="time"]')

    expect(dateInput).not.toBeNull()
    expect(timeInput).not.toBeNull()

    fireEvent.change(screen.getByPlaceholderText(/Enter announcement title/i), {
      target: { value: 'Water Interruption Advisory' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Enter announcement content/i), {
      target: { value: 'Water supply will be unavailable from 1 PM to 3 PM.' },
    })
    fireEvent.change(dateInput as HTMLInputElement, {
      target: { value: '2099-12-31' },
    })
    fireEvent.change(timeInput as HTMLInputElement, {
      target: { value: '13:30' },
    })
    fireEvent.click(screen.getByLabelText(/Mark as Important Announcement/i))

    fireEvent.click(screen.getByRole('button', { name: /Create Announcement/i }))

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalledTimes(1)
      expect(mockSuccessToast).toHaveBeenCalledWith('Announcement created successfully!')
      expect(mockPush).toHaveBeenCalledWith('/bhw/announcement')
    })

    expect(mockCollection).toHaveBeenCalledWith({}, 'announcements')
    expect(mockAddDoc).toHaveBeenCalledWith(
      'announcements-collection-ref',
      expect.objectContaining({
        createdBy: 'BHW Tester',
        createdById: 'bhw-1',
        title: 'Water Interruption Advisory',
        content: 'Water supply will be unavailable from 1 PM to 3 PM.',
        date: '2099-12-31',
        time: '13:30',
        important: true,
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp',
      })
    )
  })
})
