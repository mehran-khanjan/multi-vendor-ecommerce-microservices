import React from 'react'
import { render, screen } from '@testing-library/react'
import VendorOrdersPage from '@/app/vendor/orders/page'
import { mockOrders } from '@/lib/mock-data'

// Mock mock-data
jest.mock('@/lib/mock-data', () => ({
    mockOrders: [
        { id: 'ORD-001', date: '2026-01-15', items: 2, total: 299.99, status: 'delivered' },
        { id: 'ORD-002', date: '2026-01-14', items: 1, total: 149.98, status: 'shipped' },
        { id: 'ORD-003', date: '2026-01-13', items: 3, total: 89.99, status: 'processing' },
    ],
}))

// Mock lucide-react
jest.mock('lucide-react', () => ({
    ChevronRight: () => <svg data-testid="chevron-right-icon" />,
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, variant, size, ...props }: any) => (
        <button {...props} data-variant={variant} data-size={size}>
            {children}
        </button>
    ),
}))

describe('VendorOrdersPage', () => {
    beforeEach(() => {
        // Mock window.matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        })
    })

    test('renders orders page with correct title and order count', () => {
        render(<VendorOrdersPage />)

        expect(screen.getByText('Orders')).toBeInTheDocument()
        expect(screen.getByText(`Manage ${mockOrders.length} orders`)).toBeInTheDocument()
    })

    test('renders all orders from mock data', () => {
        render(<VendorOrdersPage />)

        mockOrders.forEach(order => {
            expect(screen.getByText(order.id)).toBeInTheDocument()
            expect(screen.getByText(`$${order.total.toFixed(2)}`)).toBeInTheDocument()
            expect(screen.getByText(order.status)).toBeInTheDocument()
            expect(screen.getByText(`${order.date} • ${order.items} item(s)`)).toBeInTheDocument()
        })
    })

    test('applies correct status colors', () => {
        render(<VendorOrdersPage />)

        const deliveredStatus = screen.getByText('delivered')
        expect(deliveredStatus).toHaveClass('text-green-600')

        const shippedStatus = screen.getByText('shipped')
        expect(shippedStatus).toHaveClass('text-blue-600')

        const processingStatus = screen.getByText('processing')
        expect(processingStatus).toHaveClass('text-yellow-600')
    })

    test('renders order cards with glass effect and hover states', () => {
        render(<VendorOrdersPage />)

        const orderCards = screen.getAllByText(/ORD-\d{3}/)
        orderCards.forEach(card => {
            expect(card.closest('.glass')).toBeInTheDocument()
            expect(card.closest('.hover\\:shadow-md')).toBeInTheDocument()
            expect(card.closest('.transition-shadow')).toBeInTheDocument()
        })
    })

    test('renders view button with chevron icon', () => {
        render(<VendorOrdersPage />)

        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBe(mockOrders.length)

        buttons.forEach(button => {
            expect(button).toHaveAttribute('data-variant', 'ghost')
            expect(button).toHaveAttribute('data-size', 'icon')
        })

        expect(screen.getAllByTestId('chevron-right-icon').length).toBe(mockOrders.length)
    })

    test('formats currency correctly', () => {
        render(<VendorOrdersPage />)

        mockOrders.forEach(order => {
            const formattedAmount = `$${order.total.toFixed(2)}`
            expect(screen.getByText(formattedAmount)).toBeInTheDocument()
        })
    })

    test('has accessible order information', () => {
        render(<VendorOrdersPage />)

        mockOrders.forEach(order => {
            const orderElement = screen.getByText(order.id)
            expect(orderElement).toHaveClass('font-semibold', 'text-zinc-900', 'dark:text-zinc-100')
        })
    })

    test('renders in dark mode correctly', () => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: query === '(prefers-color-scheme: dark)',
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        })

        render(<VendorOrdersPage />)

        expect(screen.getByText('Orders')).toHaveClass('dark:text-zinc-100')
    })
})