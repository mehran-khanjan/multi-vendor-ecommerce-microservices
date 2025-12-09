import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import AdminOrderDetailPage from '@/app/admin/orders/[slug]/page'
import { mockOrders } from '@/tests/mocks/lib/mock-data'

// Mock useParams
jest.mock('next/navigation', () => ({
    ...jest.requireActual('next/navigation'),
    useParams: () => ({ slug: 'ORD-001' }),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    ArrowLeft: () => <div data-testid="arrow-left">←</div>,
    Download: () => <div data-testid="download-icon">↓</div>,
    MoreVertical: () => <div data-testid="more-icon">⋯</div>,
    Ban: () => <div data-testid="ban-icon">⛔</div>,
    CheckCircle: () => <div data-testid="check-icon">✓</div>,
}))

describe('AdminOrderDetailPage', () => {
    const mockOrder = mockOrders[0]

    test('renders back to orders link', () => {
        render(<AdminOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText('Back to Orders')).toBeInTheDocument()
        expect(screen.getByTestId('arrow-left')).toBeInTheDocument()
    })

    test('renders order ID and date in header', () => {
        render(<AdminOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText(mockOrder.id)).toBeInTheDocument()
        expect(screen.getByText(mockOrder.date)).toBeInTheDocument()
    })

    test('renders correct status badge', () => {
        render(<AdminOrderDetailPage params={{ slug: 'ORD-001' }} />)

        const badge = screen.getByText(mockOrder.status)
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveClass('bg-yellow-600') // pending status
    })

    test('renders customer information section', () => {
        render(<AdminOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText('Customer Information')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('+1 (555) 000-0000')).toBeInTheDocument()
    })

    test('renders shipping address section', () => {
        render(<AdminOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByText('123 Main Street')).toBeInTheDocument()
        expect(screen.getByText('San Francisco, CA 94102')).toBeInTheDocument()
    })

    test('renders order items section', () => {
        render(<AdminOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText(`Order Items (${mockOrder.items})`)).toBeInTheDocument()
        expect(screen.getAllByText('Premium Wireless Headphones')).toHaveLength(2)
        expect(screen.getAllByText('$299.99')).toHaveLength(2)
    })

    test('renders order summary with correct calculations', () => {
        render(<AdminOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText('Order Summary')).toBeInTheDocument()
        expect(screen.getByText('$599.98')).toBeInTheDocument() // Subtotal
        expect(screen.getByText('$10.00')).toBeInTheDocument() // Shipping
        expect(screen.getByText('$48.00')).toBeInTheDocument() // Tax
        expect(screen.getByText(`$${mockOrder.total.toFixed(2)}`)).toBeInTheDocument() // Total
    })

    test('renders action buttons', () => {
        render(<AdminOrderDetailPage params={{ slug: 'ORD-001' }} />)

        expect(screen.getByText('Approve Order')).toBeInTheDocument()
        expect(screen.getByText('Download Invoice')).toBeInTheDocument()
        expect(screen.getByText('Reject Order')).toBeInTheDocument()
    })

    test('opens dropdown menu when more button is clicked', () => {
        render(<AdminOrderDetailPage params={{ slug: 'ORD-001' }} />)

        const moreButton = screen.getByTestId('more-icon').closest('button')
        fireEvent.click(moreButton!)

        // Dropdown items should be accessible
        expect(screen.getByText('Export Invoice')).toBeInTheDocument()
        expect(screen.getByText('Mark as Completed')).toBeInTheDocument()
        expect(screen.getByText('Cancel Order')).toBeInTheDocument()
    })
})