import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import AccountDashboard from '@/app/my-account/page'
import { mockOrders } from '@/tests/mocks/consumer-data'

// Mock usePathname
jest.mock('next/navigation', () => ({
    usePathname: () => '/my-account',
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    User: () => <div data-testid="user-icon">👤</div>,
    ShoppingBag: () => <div data-testid="shopping-bag-icon">🛍️</div>,
    Heart: () => <div data-testid("heart-icon">❤️</div>,
MapPin: () => <div data-testid("map-icon">📍</div>,
Star: () => <div data-testid("star-icon">⭐</div>,
Settings: () => <div data-testid("settings-icon">⚙️</div>,
Mail: () => <div data-testid("mail-icon">📧</div>,
Calendar: () => <div data-testid("calendar-icon">📅</div>,
Award: () => <div data-testid("award-icon">🏆</div>,
}))

describe('My Account Dashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders account layout with sidebar', () => {
        const { container } = render(<AccountDashboard />)

        expect(screen.getByText('My Account')).toBeInTheDocument()
        expect(container.querySelector('.grid-cols-1.md\\:grid-cols-4')).toBeInTheDocument()
    })

    test('renders profile card with user information', () => {
        render(<AccountDashboard />)

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Customer')).toBeInTheDocument()
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    test('renders stats cards with correct data', () => {
        render(<AccountDashboard />)

        expect(screen.getByText('12')).toBeInTheDocument()
        expect(screen.getByText('Total Orders')).toBeInTheDocument()
        expect(screen.getByText('1,240')).toBeInTheDocument()
        expect(screen.getByText('Loyalty Points')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('Saved Addresses')).toBeInTheDocument()
        expect(screen.getByText('2 years')).toBeInTheDocument()
        expect(screen.getByText('Member Since')).toBeInTheDocument()
    })

    test('renders recent orders section', () => {
        render(<AccountDashboard />)

        expect(screen.getByText('Recent Orders')).toBeInTheDocument()
        expect(screen.getByText('View All')).toBeInTheDocument()

        mockOrders.slice(0, 3).forEach(order => {
            expect(screen.getByText(order.id)).toBeInTheDocument()
            expect(screen.getByText(`$${order.total.toFixed(2)}`)).toBeInTheDocument()
        })
    })

    test('renders sidebar navigation with active state', () => {
        render(<AccountDashboard />)

        const navItems = [
            'Dashboard',
            'Orders',
            'Wishlist',
            'Addresses',
            'Reviews',
            'Settings',
        ]

        navItems.forEach(item => {
            expect(screen.getByText(item)).toBeInTheDocument()
        })

        // Dashboard should be active
        const dashboardLink = screen.getByText('Dashboard').closest('a')
        expect(dashboardLink).toHaveClass('bg-zinc-900', 'dark:bg-zinc-100')
    })

    test('applies glass effect styling', () => {
        render(<AccountDashboard />)

        const glassElements = screen.getAllByText('John Doe').map(el => el.closest('.glass'))
        expect(glassElements.length).toBeGreaterThan(0)
        expect(glassElements.every(el => el !== null)).toBe(true)
    })

    test('renders order status with correct colors', () => {
        render(<AccountDashboard />)

        const pendingStatus = screen.getAllByText('pending')[0]
        expect(pendingStatus).toHaveClass('text-yellow-600')

        const shippedStatus = screen.getByText('shipped')
        expect(shippedStatus).toHaveClass('text-blue-600')
    })
})