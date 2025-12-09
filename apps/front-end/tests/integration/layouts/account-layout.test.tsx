import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import AccountLayout from '@/app/my-account/layout'

// Mock usePathname
jest.mock('next/navigation', () => ({
    usePathname: () => '/my-account/orders',
}))

describe('Account Layout', () => {
    const mockChildren = <div data-testid="account-content">Account Content</div>

    test('renders account title', () => {
        render(<AccountLayout>{mockChildren}</AccountLayout>)

        expect(screen.getByText('My Account')).toBeInTheDocument()
    })

    test('renders sidebar navigation', () => {
        render(<AccountLayout>{mockChildren}</AccountLayout>)

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
    })

    test('highlights active navigation item', () => {
        render(<AccountLayout>{mockChildren}</AccountLayout>)

        const ordersLink = screen.getByText('Orders').closest('a')
        expect(ordersLink).toHaveClass('bg-zinc-900', 'dark:bg-zinc-100')
    })

    test('renders children content', () => {
        render(<AccountLayout>{mockChildren}</AccountLayout>)

        expect(screen.getByTestId('account-content')).toBeInTheDocument()
        expect(screen.getByText('Account Content')).toBeInTheDocument()
    })

    test('applies correct grid layout', () => {
        const { container } = render(<AccountLayout>{mockChildren}</AccountLayout>)

        const grid = container.querySelector('.grid-cols-1.md\\:grid-cols-4')
        expect(grid).toBeInTheDocument()
    })

    test('applies sticky positioning to sidebar', () => {
        render(<AccountLayout>{mockChildren}</AccountLayout>)

        const sidebar = screen.getByText('Dashboard').closest('div')
        expect(sidebar).toHaveClass('sticky')
        expect(sidebar).toHaveClass('top-20')
    })

    test('applies glass effect to sidebar', () => {
        render(<AccountLayout>{mockChildren}</AccountLayout>)

        const sidebar = screen.getByText('Dashboard').closest('.glass')
        expect(sidebar).toBeInTheDocument()
    })
})