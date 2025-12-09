import { render, screen } from '@/tests/utils/test-utils'
import SuccessPage from '@/app/checkout/success/[id]/page'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    CheckCircle2: () => <div data-testid="check-icon">✓</div>,
    Home: () => <div data-testid="home-icon">🏠</div>,
    ShoppingBag: () => <div data-testid="shopping-bag-icon">🛍️</div>,
    Download: () => <div data-testid="download-icon">📥</div>,
}))

describe('Checkout Success Page', () => {
    const mockParams = { id: 'ORD-12345' }

    test('renders success message and order ID', () => {
        render(<SuccessPage params={mockParams} />)

        expect(screen.getByText('Order Confirmed!')).toBeInTheDocument()
        expect(screen.getByText('Thank you for your purchase')).toBeInTheDocument()
        expect(screen.getByText(mockParams.id)).toBeInTheDocument()
    })

    test('renders order confirmation details', () => {
        render(<SuccessPage params={mockParams} />)

        expect(screen.getByText('Order Number')).toBeInTheDocument()
        expect(screen.getByText('A confirmation email has been sent')).toBeInTheDocument()
    })

    test('renders all action buttons', () => {
        render(<SuccessPage params={mockParams} />)

        expect(screen.getByText('View Order Details')).toBeInTheDocument()
        expect(screen.getByText('Continue Shopping')).toBeInTheDocument()
        expect(screen.getByText('Download Invoice')).toBeInTheDocument()
    })

    test('has correct links for action buttons', () => {
        render(<SuccessPage params={mockParams} />)

        const viewOrderButton = screen.getByText('View Order Details').closest('a')
        expect(viewOrderButton).toHaveAttribute('href', '/my-account/orders')

        const continueShoppingButton = screen.getByText('Continue Shopping').closest('a')
        expect(continueShoppingButton).toHaveAttribute('href', '/')
    })

    test('applies correct styling to success icon', () => {
        render(<SuccessPage params={mockParams} />)

        const successIcon = screen.getByTestId('check-icon')
        const container = successIcon.closest('div')
        expect(container).toHaveClass('text-green-600')
    })
})