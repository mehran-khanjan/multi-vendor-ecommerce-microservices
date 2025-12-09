import { render, screen, waitFor } from '@/tests/utils/test-utils'
import AdminDashboard from '@/app/admin/dashboard/page'
import * as mockData from '@/tests/mocks/lib/mock-data'

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
    Users: () => <div data-testid="users-icon">Users Icon</div>,
    Store: () => <div data-testid="store-icon">Store Icon</div>,
    ShoppingBag: () => <div data-testid="shopping-bag-icon">Shopping Bag Icon</div>,
    BarChart3: () => <div data-testid="bar-chart-icon">Bar Chart Icon</div>,
}))

describe('AdminDashboard Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders dashboard title and description', () => {
        render(<AdminDashboard />)

        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Welcome to your admin control center')).toBeInTheDocument()
    })

    test('renders all stat cards with correct data', () => {
        render(<AdminDashboard />)

        // Check for all stat labels
        expect(screen.getByText('Total Users')).toBeInTheDocument()
        expect(screen.getByText('Active Vendors')).toBeInTheDocument()
        expect(screen.getByText('Total Orders')).toBeInTheDocument()
        expect(screen.getByText('Revenue')).toBeInTheDocument()

        // Check for stat values
        expect(screen.getByText('12,543')).toBeInTheDocument()
        expect(screen.getByText('342')).toBeInTheDocument()
        expect(screen.getByText('28,634')).toBeInTheDocument()
        expect(screen.getByText('$542,890')).toBeInTheDocument()

        // Check for change percentages
        expect(screen.getAllByText(/\+[\d.]+%/)).toHaveLength(4)
    })

    test('renders recent activity section', () => {
        render(<AdminDashboard />)

        expect(screen.getByText('Recent Activity')).toBeInTheDocument()

        // Check for activity items
        expect(screen.getByText('New order placed')).toBeInTheDocument()
        expect(screen.getByText('Order #ORD-12345')).toBeInTheDocument()
        expect(screen.getByText('2 minutes ago')).toBeInTheDocument()

        expect(screen.getByText('Vendor registered')).toBeInTheDocument()
        expect(screen.getByText('TechHub Store')).toBeInTheDocument()
        expect(screen.getByText('15 minutes ago')).toBeInTheDocument()
    })

    test('renders all activity items', () => {
        render(<AdminDashboard />)

        const activityItems = [
            'New order placed',
            'Vendor registered',
            'Payment received',
            'Product flagged'
        ]

        activityItems.forEach(item => {
            expect(screen.getByText(item)).toBeInTheDocument()
        })
    })

    test('has correct grid layout for stats on large screens', () => {
        render(<AdminDashboard />)

        const statsContainer = screen.getByText('Total Users').closest('.grid')
        expect(statsContainer).toHaveClass('lg:grid-cols-4')
        expect(statsContainer).toHaveClass('md:grid-cols-2')
        expect(statsContainer).toHaveClass('grid-cols-1')
    })

    test('applies glass effect to stat cards', () => {
        render(<AdminDashboard />)

        const statCards = screen.getAllByText('Total Users')[0].closest('.glass')
        expect(statCards).toBeInTheDocument()
        expect(statCards).toHaveClass('rounded-xl')
    })
})