import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import VendorDashboard from '@/app/vendor/dashboard/page'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    ShoppingBag: () => <svg data-testid="shopping-bag-icon" />,
    TrendingUp: () => <svg data-testid="trending-up-icon" />,
    DollarSign: () => <svg data-testid="dollar-sign-icon" />,
    Users: () => <svg data-testid="users-icon" />,
}))

describe('VendorDashboard', () => {
    beforeEach(() => {
        // Mock window.matchMedia for dark mode
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

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('renders dashboard with correct title and welcome message', () => {
        render(<VendorDashboard />)

        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Welcome back to your vendor dashboard')).toBeInTheDocument()
    })

    test('renders all stat cards with correct data', () => {
        render(<VendorDashboard />)

        const stats = [
            { label: 'Total Orders', value: '248', trend: '+12.5%' },
            { label: 'Revenue', value: '$24,580', trend: '+8.2%' },
            { label: 'Growth Rate', value: '23%', trend: '+3%' },
            { label: 'Active Customers', value: '1,234', trend: '+15.3%' },
        ]

        stats.forEach(stat => {
            expect(screen.getByText(stat.label)).toBeInTheDocument()
            expect(screen.getByText(stat.value)).toBeInTheDocument()
            expect(screen.getByText(stat.trend)).toBeInTheDocument()
        })
    })

    test('renders all icons in stat cards', () => {
        render(<VendorDashboard />)

        expect(screen.getByTestId('shopping-bag-icon')).toBeInTheDocument()
        expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument()
        expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument()
        expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    })

    test('renders recent orders section with correct data', () => {
        render(<VendorDashboard />)

        expect(screen.getByText('Recent Orders')).toBeInTheDocument()

        const recentOrders = [
            { id: 'ORD-001', customer: 'John Doe', amount: '$299.99', status: 'completed' },
            { id: 'ORD-002', customer: 'Jane Smith', amount: '$149.98', status: 'processing' },
            { id: 'ORD-003', customer: 'Bob Johnson', amount: '$89.99', status: 'shipped' },
        ]

        recentOrders.forEach(order => {
            expect(screen.getByText(order.id)).toBeInTheDocument()
            expect(screen.getByText(order.customer)).toBeInTheDocument()
            expect(screen.getByText(order.amount)).toBeInTheDocument()
            expect(screen.getByText(order.status)).toBeInTheDocument()
        })
    })

    test('applies correct status colors for orders', () => {
        render(<VendorDashboard />)

        const completedOrder = screen.getByText('completed')
        expect(completedOrder).toHaveClass('text-green-600')

        const shippedOrder = screen.getByText('shipped')
        expect(shippedOrder).toHaveClass('text-blue-600')

        const processingOrder = screen.getByText('processing')
        expect(processingOrder).toHaveClass('text-yellow-600')
    })

    test('has glass effect on all cards', () => {
        render(<VendorDashboard />)

        const statCards = screen.getAllByText(/Total Orders|Revenue|Growth Rate|Active Customers/)
        statCards.forEach(card => {
            expect(card.closest('.glass')).toBeInTheDocument()
        })

        const recentOrdersSection = screen.getByText('Recent Orders')
        expect(recentOrdersSection.closest('.glass')).toBeInTheDocument()
    })

    test('renders with correct grid layout', () => {
        render(<VendorDashboard />)

        const statsGrid = screen.getByText('Total Orders').closest('div[class*="grid"]')
        expect(statsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
    })

    test('has proper spacing and padding', () => {
        render(<VendorDashboard />)

        const container = screen.getByText('Dashboard').closest('.p-6')
        expect(container).toHaveClass('sm:p-8', 'pt-8')
    })

    test('is accessible with proper contrast', () => {
        render(<VendorDashboard />)

        // Check main text contrast
        const mainTitle = screen.getByText('Dashboard')
        expect(mainTitle).toHaveClass('text-zinc-900', 'dark:text-zinc-100')

        // Check stat values contrast
        const statValue = screen.getByText('$24,580')
        expect(statValue).toHaveClass('text-zinc-900', 'dark:text-zinc-100')
    })

    test('handles dark mode correctly', () => {
        // Mock dark mode
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

        render(<VendorDashboard />)

        // Check dark mode classes
        const title = screen.getByText('Dashboard')
        expect(title).toHaveClass('dark:text-zinc-100')

        const description = screen.getByText('Welcome back to your vendor dashboard')
        expect(description).toHaveClass('dark:text-zinc-400')
    })
})