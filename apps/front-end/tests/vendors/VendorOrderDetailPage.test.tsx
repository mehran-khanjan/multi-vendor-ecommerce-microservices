import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import VendorOrderDetailPage from '@/app/vendor/orders/[slug]/page'
import { mockOrders } from '@/lib/mock-data'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useParams: () => ({ slug: 'ORD-001' }),
}))

// Mock mock-data
jest.mock('@/lib/mock-data', () => ({
    mockOrders: [
        { id: 'ORD-001', date: '2026-01-15', items: 2, total: 299.99, status: 'delivered' },
        { id: 'ORD-002', date: '2026-01-14', items: 1, total: 149.98, status: 'processing' },
    ],
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, className, disabled, ...props }: any) => (
        <button className={className} disabled={disabled} {...props}>
            {children}
        </button>
    ),
}))

jest.mock('@/components/ui/badge', () => ({
    Badge: ({ children, className }: any) => (
        <span className={className}>{children}</span>
    ),
}))

// Mock lucide-react
jest.mock('lucide-react', () => ({
    ArrowLeft: () => <svg data-testid="arrow-left-icon" />,
    Package: () => <svg data-testid="package-icon" />,
    Truck: () => <svg data-testid="truck-icon" />,
    CheckCircle: () => <svg data-testid="check-circle-icon" />,
}))

// Mock Link
jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

describe('VendorOrderDetailPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders order detail page with back link', () => {
        render(<VendorOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText('Back to Orders')).toBeInTheDocument()
        expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument()
    })

    test('displays correct order information', () => {
        render(<VendorOrderDetailPage params={{ slug: 'ORD-001' }} />)

        const order = mockOrders[0]
        expect(screen.getByText(order.id)).toBeInTheDocument()
        expect(screen.getByText(order.date)).toBeInTheDocument()
    })

    test('shows correct badge color based on status', () => {
        render(<VendorOrderDetailPage params={{ slug: 'ORD-001' }} />)

        const badge = screen.getByText('delivered')
        expect(badge).toHaveClass('bg-green-600')
    })

    test('renders order status timeline', () => {
        render(<VendorOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText('Order Status')).toBeInTheDocument()
        expect(screen.getByTestId('package-icon')).toBeInTheDocument()
        expect(screen.getByTestId('truck-icon')).toBeInTheDocument()
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()

        // Check timeline steps
        expect(screen.getByText('Order Placed')).toBeInTheDocument()
        expect(screen.getByText('Shipped')).toBeInTheDocument()
        expect(screen.getByText('Delivered')).toBeInTheDocument()
    })

    test('shows correct order items', () => {
        render(<VendorOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText('Order Items')).toBeInTheDocument()
        expect(screen.getAllByText('Premium Wireless Headphones')).toHaveLength(2)
        expect(screen.getAllByText('$299.99')).toHaveLength(3) // Two items + total
    })

    test('displays shipping address information', () => {
        render(<VendorOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('123 Main Street')).toBeInTheDocument()
        expect(screen.getByText('San Francisco, CA 94102')).toBeInTheDocument()
    })

    test('renders order summary with correct calculations', () => {
        render(<VendorOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText('Order Summary')).toBeInTheDocument()
        expect(screen.getByText('Subtotal')).toBeInTheDocument()
        expect(screen.getByText('$599.98')).toBeInTheDocument()
        expect(screen.getByText('Shipping')).toBeInTheDocument()
        expect(screen.getByText('$10.00')).toBeInTheDocument()
        expect(screen.getByText('Tax')).toBeInTheDocument()
        expect(screen.getByText('$48.00')).toBeInTheDocument()
        expect(screen.getByText('Total')).toBeInTheDocument()
        expect(screen.getByText('$657.98')).toBeInTheDocument() // 599.98 + 10 + 48
    })

    test('disables shipped button for non-processing orders', () => {
        render(<VendorOrderDetailPage params={{ slug: 'ORD-001' }} />)

        const shippedButton = screen.getByText('Already Shipped')
        expect(shippedButton).toBeDisabled()
    })

    test('enables shipped button for processing orders', () => {
        render(<VendorOrderDetailPage params={{ slug: 'ORD-002' }} />)

        const shippedButton = screen.getByText('Mark as Shipped')
        expect(shippedButton).toBeEnabled()
    })

    test('prints invoice when print button is clicked', () => {
        const mockPrint = jest.fn()
        window.print = mockPrint

        render(<VendorOrderDetailPage params={{ slug: 'ORD-001' }} />)

        const printButton = screen.getByText('Print Invoice')
        fireEvent.click(printButton)

        expect(mockPrint).toHaveBeenCalled()
    })

    test('handles missing order gracefully', () => {
        render(<VendorOrderDetailPage params={{ slug: 'NON-EXISTENT' }} />)

        // Should fall back to first order
        expect(screen.getByText(mockOrders[0].id)).toBeInTheDocument()
    })

    test('has responsive grid layout', () => {
        render(<VendorOrderDetailPage params={{ slug: 'ORD-001' }} />)

        const grid = screen.getByText('Order Status').closest('.grid')
        expect(grid).toHaveClass('lg:grid-cols-3')
    })
})