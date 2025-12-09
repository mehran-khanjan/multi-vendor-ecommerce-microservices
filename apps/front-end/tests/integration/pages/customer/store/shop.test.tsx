import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import ShopPage from '@/app/shop/page'
import { mockProducts, mockCategories } from '@/tests/mocks/consumer-data'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Filter: () => <div data-testid="filter-icon">🔍</div>,
    ChevronDown: () => <div data-testid("chevron-down">⌄</div>,
}))

describe('Shop Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders shop page header', () => {
        render(<ShopPage />)

        expect(screen.getByText('Shop')).toBeInTheDocument()
        expect(screen.getByText(`Browse our collection of ${mockProducts.length} products`)).toBeInTheDocument()
    })

    test('renders search input', () => {
        render(<ShopPage />)

        expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument()
    })

    test('renders category filters', () => {
        render(<ShopPage />)

        expect(screen.getByText('Category')).toBeInTheDocument()
        expect(screen.getByText('All Categories')).toBeInTheDocument()

        mockCategories.forEach(category => {
            expect(screen.getByText(category.name)).toBeInTheDocument()
        })
    })

    test('renders price range filters', () => {
        render(<ShopPage />)

        expect(screen.getByText('Price Range')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Min price')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Max price')).toBeInTheDocument()
    })

    test('renders sort dropdown', () => {
        render(<ShopPage />)

        expect(screen.getByText('Sort')).toBeInTheDocument()
    })

    test('filters products by category', async () => {
        render(<ShopPage />)

        const electronicsCategory = screen.getByText('Electronics')
        fireEvent.click(electronicsCategory)

        await waitFor(() => {
            const electronicsProducts = mockProducts.filter(p => p.category === 'electronics')
            expect(screen.getByText(`${electronicsProducts.length} products`)).toBeInTheDocument()
        })
    })

    test('filters products by search query', async () => {
        render(<ShopPage />)

        const searchInput = screen.getByPlaceholderText('Search products...')
        fireEvent.change(searchInput, { target: { value: 'Wireless' } })

        await waitFor(() => {
            const filteredProducts = mockProducts.filter(p => p.name.includes('Wireless'))
            filteredProducts.forEach(product => {
                expect(screen.getByText(product.name)).toBeInTheDocument()
            })
        })
    })

    test('shows active filter badges', async () => {
        render(<ShopPage />)

        const electronicsCategory = screen.getByText('Electronics')
        fireEvent.click(electronicsCategory)

        await waitFor(() => {
            expect(screen.getByText('Electronics')).toBeInTheDocument()
        })
    })

    test('clears filters with clear button', async () => {
        render(<ShopPage />)

        const electronicsCategory = screen.getByText('Electronics')
        fireEvent.click(electronicsCategory)

        const clearButton = screen.getByText('Clear Filters')
        fireEvent.click(clearButton)

        await waitFor(() => {
            expect(screen.getByText('All Categories')).toHaveClass('bg-zinc-900', 'dark:bg-zinc-100')
        })
    })

    test('applies correct grid layout', () => {
        render(<ShopPage />)

        const mainGrid = screen.getByText('Shop').closest('.grid')
        expect(mainGrid).toHaveClass('lg:grid-cols-4')
    })

    test('displays empty state when no products match filters', async () => {
        render(<ShopPage />)

        const searchInput = screen.getByPlaceholderText('Search products...')
        fireEvent.change(searchInput, { target: { value: 'NonexistentProduct' } })

        await waitFor(() => {
            expect(screen.getByText('No products found matching your filters.')).toBeInTheDocument()
        })
    })
})