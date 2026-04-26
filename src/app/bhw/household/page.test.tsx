import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import HouseholdPage from './page'

const mockPush = jest.fn()
const mockGetDocs = jest.fn()
const mockCollection = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

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

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

jest.mock('@/lib/toast', () => ({
  successToast: jest.fn(),
  errorToast: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: jest.fn(),
  doc: jest.fn(),
  where: jest.fn(),
  writeBatch: jest.fn(),
}))

interface MockDocData {
  id: string
  data: {
    householdNumber: string
    headOfHousehold: string
    address: string
    totalMembers: number
    totalFamily: number
    email: string
    headOfHouseholdContactNumber: string
    createdAt: { toDate: () => Date }
  }
}

function createQuerySnapshot(docs: MockDocData[]) {
  return {
    forEach: (callback: (doc: { id: string; data: () => MockDocData['data'] }) => void) => {
      docs.forEach((doc) => {
        callback({
          id: doc.id,
          data: () => doc.data,
        })
      })
    },
  }
}

describe('Household page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCollection.mockReturnValue('household-collection-ref')
  })

  it('renders households in numeric order and filters by search term', async () => {
    mockGetDocs.mockResolvedValueOnce(
      createQuerySnapshot([
        {
          id: '3',
          data: {
            householdNumber: 'BRGY7-16',
            headOfHousehold: 'Carla Reyes',
            address: 'Zone 3',
            totalMembers: 4,
            totalFamily: 1,
            email: 'carla@example.com',
            headOfHouseholdContactNumber: '09123456789',
            createdAt: { toDate: () => new Date() },
          },
        },
        {
          id: '1',
          data: {
            householdNumber: 'BRGY7-2',
            headOfHousehold: 'Ana Dela Cruz',
            address: 'Zone 1',
            totalMembers: 3,
            totalFamily: 1,
            email: 'ana@example.com',
            headOfHouseholdContactNumber: '09111111111',
            createdAt: { toDate: () => new Date() },
          },
        },
      ])
    )

    render(<HouseholdPage />)

    await waitFor(() => {
      expect(screen.getByText('BRGY7-2')).toBeInTheDocument()
      expect(screen.getByText('BRGY7-16')).toBeInTheDocument()
    })

    const householdCells = screen.getAllByRole('cell', {
      name: /BRGY7-/i,
    })
    expect(householdCells[0]).toHaveTextContent('BRGY7-2')
    expect(householdCells[1]).toHaveTextContent('BRGY7-16')

    fireEvent.change(screen.getByPlaceholderText(/search by household number/i), {
      target: { value: 'Carla' },
    })

    expect(screen.queryByText('BRGY7-2')).not.toBeInTheDocument()
    expect(screen.getByText('BRGY7-16')).toBeInTheDocument()
  })
})
