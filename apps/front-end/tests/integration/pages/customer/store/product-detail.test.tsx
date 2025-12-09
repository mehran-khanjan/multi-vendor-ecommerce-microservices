import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import ProductPage from '@/app/shop/[slug]/page'
import { mockProducts } from '@/tests/mocks/consumer-data'

// Mock useParams
jest.mock('next/navigation', () => ({
    useParams: () => ({ slug: 'wireless-headphones-pro' }),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Heart: () => <div data-testid="heart-icon">❤️</div>,
    Share2: () => <div data-testid="share-icon">🔗</div>,
    ShoppingCart: () => <div data-testid("cart-icon">🛒</div>,
Truck: () => <div data-testid("truck-icon">🚚</div>,
Shield: () => <div data-testid("shield-icon">🛡️</div>,
RotateCcw: () => <div data-testid("return-icon">🔄</div>,
}))

describe('Product Detail Page', () => {
    const mockProduct = mockProducts[0]
    const relatedProducts = mockProducts.filter(p => p.category === mockProduct.category && p.id !== mockProduct.id)

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders product name and vendor', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
            expect(screen.getByText(mockProduct.vendor)).toBeInTheDocument()
        })
    })

    test('renders product price and discount', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            expect(screen.getByText(`$${mockProduct.price.toFixed(2)}`)).toBeInTheDocument()
            expect(screen.getByText(`$${mockProduct.originalPrice.toFixed(2)}`)).toBeInTheDocument()
        })
    })

    test('renders star rating and review count', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            const starRating = screen.getByTestId('star-rating')
            expect(starRating).toBeInTheDocument()
        })
    })

    test('renders product description', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            expect(screen.getByText(mockProduct.description)).toBeInTheDocument()
        })
    })

    test('renders product features', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            expect(screen.getByText('Free shipping on orders over $50')).toBeInTheDocument()
            expect(screen.getByText('100% authentic and guaranteed')).toBeInTheDocument()
            expect(screen.getByText('30-day easy returns')).toBeInTheDocument()
        })
    })

    test('renders quantity selector', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            expect(screen.getByText('Quantity:')).toBeInTheDocument()
            expect(screen.getByText('1')).toBeInTheDocument()
        })
    })

    test('adjusts quantity with buttons', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            const minusButton = screen.getByText('−')
            const plusButton = screen.getByText('+')

            fireEvent.click(plusButton)
            expect(screen.getByText('2')).toBeInTheDocument()

            fireEvent.click(minusButton)
            expect(screen.getByText('1')).toBeInTheDocument()
        })
    })

    test('renders action buttons', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            expect(screen.getByText('Add to Cart')).toBeInTheDocument()
            expect(screen.getByTestId('heart-icon')).toBeInTheDocument()
            expect(screen.getByTestId('share-icon')).toBeInTheDocument()
        })
    })

    test('toggles wishlist state', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            const wishlistButton = screen.getByTestId('heart-icon').closest('button')
            fireEvent.click(wishlistButton)

            // Heart should be filled after clicking
            expect(screen.getByTestId('heart-icon')).toBeInTheDocument()
        })
    })

    test('renders product tabs', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            expect(screen.getByText('Description')).toBeInTheDocument()
            expect(screen.getByText(`Reviews (${mockProduct.reviews})`)).toBeInTheDocument()
        })
    })

    test('renders related products', async () => {
        render(<ProductPage />)

        await waitFor(() => {
            expect(screen.getByText('Related Products')).toBeInTheDocument()
            relatedProducts.slice(0, 4).forEach(product => {
                expect(screen.getByText(product.name)).toBeInTheDocument()
            })
        })
    })

    test('handles out of stock state', async () => {
        // Mock an out of stock product
        const outOfStockProduct = { ...mockProducts[1] } // Second product is out of stock
        jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({ slug: outOfStockProduct.slug })

        render(<ProductPage />)

        await waitFor(() => {
            expect(screen.getByText('Out of Stock')).toBeInTheDocument()
            expect(screen.getByText('This product is currently out of stock')).toBeInTheDocument()
        })
    })
})