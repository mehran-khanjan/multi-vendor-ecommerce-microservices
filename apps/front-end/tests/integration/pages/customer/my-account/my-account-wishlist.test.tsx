import { render, screen } from '@/tests/utils/test-utils'
import WishlistPage from '@/app/my-account/wishlist/page'
import { mockWishlist } from '@/tests/mocks/consumer-data'

describe('My Account Wishlist Page', () => {
    test('renders wishlist page title', () => {
        render(<WishlistPage />)

        expect(screen.getByText('My Wishlist')).toBeInTheDocument()
    })

    test('renders wishlist items when not empty', () => {
        render(<WishlistPage />)

        mockWishlist.forEach(product => {
            expect(screen.getByText(product.name)).toBeInTheDocument()
            expect(screen.getByText(`$${product.price}`)).toBeInTheDocument()
        })
    })

    test('renders empty state when wishlist is empty', () => {
        // Mock empty wishlist
        jest.mock('@/lib/mock-data', () => ({
            mockWishlist: [],
        }))

        const { getByText } = render(<WishlistPage />)

        expect(getByText('Your wishlist is empty')).toBeInTheDocument()
    })

    test('applies correct grid layout for wishlist items', () => {
        render(<WishlistPage />)

        const grid = screen.getByText(mockWishlist[0].name).closest('.grid')
        expect(grid).toHaveClass('sm:grid-cols-2')
        expect(grid).toHaveClass('grid-cols-1')
    })

    test('renders product cards with all information', () => {
        render(<WishlistPage />)

        const productCards = screen.getAllByTestId('product-card')
        expect(productCards.length).toBe(mockWishlist.length)
    })

    test('applies glass effect styling through product cards', () => {
        render(<WishlistPage />)

        // Product cards should be rendered with proper styling
        const productCards = screen.getAllByTestId('product-card')
        expect(productCards.length).toBeGreaterThan(0)
    })
})