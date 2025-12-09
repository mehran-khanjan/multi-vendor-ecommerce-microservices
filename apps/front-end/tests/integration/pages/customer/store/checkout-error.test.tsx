import { render, screen } from '@/tests/utils/test-utils'
import ErrorPage from '@/app/checkout/error/[id]/page'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    AlertCircle: () => <div data-testid="alert-icon">⚠️</div>,
    Home: () => <div data-testid="home-icon">🏠</div>,
    RotateCcw: () => <div data-testid="retry-icon">🔄</div>,
}))

describe('Checkout Error Page', () => {
    const mockParams = { id: 'PAY-001' }

    test('renders error message and error code', () => {
        render(<ErrorPage params={mockParams} />)

        expect(screen.getByText('Payment Failed')).toBeInTheDocument()
        expect(screen.getByText(`ERR-${mockParams.id}`)).toBeInTheDocument()
    })

    test('renders error description', () => {
        render(<ErrorPage params={mockParams} />)

        expect(screen.getByText('Unfortunately, your payment could not be processed')).toBeInTheDocument()
    })

    test('renders warning message about saved cart', () => {
        render(<ErrorPage params={mockParams} />)

        expect(screen.getByText('Your cart has been saved')).toBeInTheDocument()
    })

    test('renders all recovery action buttons', () => {
        render(<ErrorPage params={mockParams} />)

        expect(screen.getByText('Try Again')).toBeInTheDocument()
        expect(screen.getByText('Return to Cart')).toBeInTheDocument()
        expect(screen.getByText('Continue Shopping')).toBeInTheDocument()
    })

    test('has correct links for action buttons', () => {
        render(<ErrorPage params={mockParams} />)

        const tryAgainButton = screen.getByText('Try Again').closest('a')
        expect(tryAgainButton).toHaveAttribute('href', '/checkout')

        const returnToCartButton = screen.getByText('Return to Cart').closest('a')
        expect(returnToCartButton).toHaveAttribute('href', '/cart')

        const continueShoppingButton = screen.getByText('Continue Shopping').closest('a')
        expect(continueShoppingButton).toHaveAttribute('href', '/')
    })

    test('applies correct styling to error icon', () => {
        render(<ErrorPage params={mockParams} />)

        const errorIcon = screen.getByTestId('alert-icon')
        const container = errorIcon.closest('div')
        expect(container).toHaveClass('text-red-600')
    })
})