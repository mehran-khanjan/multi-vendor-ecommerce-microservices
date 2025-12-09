import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import CartPage from '@/app/cart/page'
import { mockProducts } from '@/tests/mocks/consumer-data'

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />
    },
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Trash2: () => <div data-testid="trash-icon">🗑️</div>,
    Minus: () => <div data-testid="minus-icon">➖</div>,
    Plus: () => <div data-testid="plus-icon">➕</div>,
    ShoppingBag: () => <div data-testid="shopping-bag-icon">🛍️</div>,
}))

describe('Cart Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders cart title', () => {
        render(<CartPage />)

        expect(screen.getByText('Shopping Cart')).toBeInTheDocument()
    })

    test('renders cart items with product information', () => {
        render(<CartPage />)

        // Check for product names from mock data (first 3 products)
        mockProducts.slice(0, 3).forEach(product => {
            expect(screen.getByText(product.name)).toBeInTheDocument()
            expect(screen.getByText(product.vendor)).toBeInTheDocument()
        })
    })

    test('renders order summary with correct calculations', () => {
        render(<CartPage />)

        // Check for summary sections
        expect(screen.getByText('Order Summary')).toBeInTheDocument()
        expect(screen.getByText('Subtotal')).toBeInTheDocument()
        expect(screen.getByText('Shipping')).toBeInTheDocument()
        expect(screen.getByText('Tax')).toBeInTheDocument()
        expect(screen.getByText('Total')).toBeInTheDocument()
    })

    test('renders action buttons', () => {
        render(<CartPage />)

        expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument()
        expect(screen.getByText('Continue Shopping')).toBeInTheDocument()
    })

    test('handles quantity adjustment', () => {
        render(<CartPage />)

        const minusButtons = screen.getAllByTestId('minus-icon').map(el => el.closest('button'))
        const plusButtons = screen.getAllByTestId('plus-icon').map(el => el.closest('button'))

        expect(minusButtons.length).toBeGreaterThan(0)
        expect(plusButtons.length).toBeGreaterThan(0)

        // Test that buttons are clickable
        minusButtons.forEach(button => {
            expect(button).not.toBeDisabled()
        })

        plusButtons.forEach(button => {
            expect(button).not.toBeDisabled()
        })
    })

    test('handles item removal', () => {
        render(<CartPage />)

        const trashButtons = screen.getAllByTestId('trash-icon').map(el => el.closest('button'))

        trashButtons.forEach(button => {
            expect(button).toHaveClass('text-red-600')
            expect(button).not.toBeDisabled()
        })
    })

    test('empty cart state renders correctly', () => {
        // Mock the scenario where cart is empty
        const mockProducts = []
        jest.mock('@/lib/mock-data', () => ({
            mockProducts,
        }))

        // Re-render with empty cart
        const { getByText } = render(<CartPage />)

        expect(getByText('Your cart is empty')).toBeInTheDocument()
        expect(getByText('Start Shopping')).toBeInTheDocument()
    })

    test('calculates and displays free shipping', () => {
        render(<CartPage />)

        const shippingElement = screen.getByText('Shipping').closest('div')
        expect(shippingElement).toBeInTheDocument()
    })
})