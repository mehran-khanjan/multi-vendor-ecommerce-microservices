import { render, screen } from '@/tests/utils/test-utils'
import OrdersPage from '@/app/my-account/orders/page'
import { mockOrders } from '@/tests/mocks/consumer-data'

// Mock usePathname
jest.mock('next/navigation', () => ({
    usePathname: () => '/my-account/orders',
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    ChevronRight: () => <div data-testid="chevron-icon">→</div>,
}))

describe('My Account Orders Page', () => {
    test('renders orders page title', () => {
        render(<OrdersPage />)

        expect(screen.getByText('Your Orders')).toBeInTheDocument()
    })

    test('renders all orders from mock data', () => {
        render(<OrdersPage />)

        mockOrders.forEach(order => {
            expect(screen.getByText(order.id)).toBeInTheDocument()
            expect(screen.getByText(order.date)).toBeInTheDocument()
            expect(screen.getByText(order.items.toString())).toBeInTheDocument()
            expect(screen.getByText(`$${order.total.toFixed(2)}`)).toBeInTheDocument()
            expect(screen.getByText(order.status)).toBeInTheDocument()
        })
    })

    test('applies correct status colors', () => {
        render(<OrdersPage />)

        const pendingStatus = screen.getByText('pending')
        expect(pendingStatus).toHaveClass('text-yellow-600')

        const shippedStatus = screen.getByText('shipped')
        expect(shippedStatus).toHaveClass('text-blue-600')

        const deliveredStatus = screen.getByText('delivered')
        expect(deliveredStatus).toHaveClass('text-green-600')
    })

    test('renders order details in grid layout', () => {
        render(<OrdersPage />)

        const orderGrid = screen.getByText(mockOrders[0].id).closest('div')
        expect(orderGrid).toHaveClass('grid')
        expect(orderGrid).toHaveClass('grid-cols-2')
        expect(orderGrid).toHaveClass('md:grid-cols-4')
    })

    test('renders view details chevron for each order', () => {
        render(<OrdersPage />)

        const chevrons = screen.getAllByTestId('chevron-icon')
        expect(chevrons.length).toBe(mockOrders.length)
    })

    test('applies hover effects to order cards', () => {
        render(<OrdersPage />)

        const orderCard = screen.getByText(mockOrders[0].id).closest('div')
        expect(orderCard).toHaveClass('hover:shadow-md')
        expect(orderCard).toHaveClass('transition-shadow')
    })
})