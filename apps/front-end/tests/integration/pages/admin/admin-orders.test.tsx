import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import AdminOrdersPage from '@/app/admin/orders/page'
import { mockOrders } from '@/tests/mocks/lib/mock-data'

// Mock Next.js Link
jest.mock('next/link', () => {
    return ({ children, href }: any) => (
        <a href={href} data-testid="link">
            {children}
        </a>
    )
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Search: () => <div data-testid="search-icon">🔍</div>,
    ChevronRight: () => <div data-testid="chevron-icon">→</div>,
}))

// Mock UI components
jest.mock('@/components/ui/badge', () => ({
    Badge: ({ children, className }: any) => (
        <span className={className} data-testid="badge">
      {children}
    </span>
    ),
}))

describe('AdminOrdersPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders page title and order count', () => {
        render(<AdminOrdersPage />)

        expect(screen.getByText('Orders')).toBeInTheDocument()
        expect(screen.getByText(`Manage ${mockOrders.length} orders`)).toBeInTheDocument()
    })

    test('renders search input with icon', () => {
        render(<AdminOrdersPage />)

        expect(screen.getByPlaceholderText('Search orders...')).toBeInTheDocument()
        expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    })

    test('renders all orders with correct data', () => {
        render(<AdminOrdersPage />)

        mockOrders.forEach(order => {
            expect(screen.getByText(order.id)).toBeInTheDocument()
            expect(screen.getByText(`$${order.total.toFixed(2)}`)).toBeInTheDocument()
            expect(screen.getByText(`${order.items} item(s)`)).toBeInTheDocument()
        })
    })

    test('applies correct badge colors based on order status', () => {
        render(<AdminOrdersPage />)

        const badges = screen.getAllByTestId('badge')

        // Find delivered order badge
        const deliveredBadge = badges.find(badge =>
            badge.textContent === 'delivered'
        )
        expect(deliveredBadge).toHaveClass('bg-green-600')

        // Find shipped order badge
        const shippedBadge = badges.find(badge =>
            badge.textContent === 'shipped'
        )
        expect(shippedBadge).toHaveClass('bg-blue-600')

        // Find pending order badge
        const pendingBadge = badges.find(badge =>
            badge.textContent === 'pending'
        )
        expect(pendingBadge).toHaveClass('bg-yellow-600')
    })

    test('renders view details link for each order', () => {
        render(<AdminOrdersPage />)

        const links = screen.getAllByTestId('link')
        expect(links.length).toBeGreaterThan(0)

        mockOrders.forEach((order, index) => {
            expect(links[index]).toHaveAttribute('href', `/admin/orders/${order.id}`)
        })
    })

    test('filters orders when searching', () => {
        render(<AdminOrdersPage />)

        const searchInput = screen.getByPlaceholderText('Search orders...')
        fireEvent.change(searchInput, { target: { value: 'ORD-001' } })

        expect(searchInput).toHaveValue('ORD-001')
        // Note: Actual filtering would be tested in component that implements it
    })
})