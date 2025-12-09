import { render, screen, waitFor } from '@/tests/utils/test-utils'
import CategoryPage from '@/app/categories/[slug]/page'
import { mockCategories, mockProducts } from '@/tests/mocks/consumer-data'

// Mock useParams
jest.mock('next/navigation', () => ({
    useParams: () => ({ slug: 'electronics' }),
}))

describe('Category Detail Page', () => {
    const mockCategory = mockCategories[0]
    const categoryProducts = mockProducts.filter(p => p.category === mockCategory.slug)

    test('renders category name and product count', async () => {
        render(<CategoryPage />)

        await waitFor(() => {
            expect(screen.getByText(mockCategory.name)).toBeInTheDocument()
            expect(screen.getByText(`${categoryProducts.length} products available`)).toBeInTheDocument()
        })
    })

    test('renders back navigation link', async () => {
        render(<CategoryPage />)

        await waitFor(() => {
            expect(screen.getByText('← Back')).toBeInTheDocument()
            expect(screen.getByText('← Back').closest('a')).toHaveAttribute('href', '/categories')
        })
    })

    test('renders products in the category', async () => {
        render(<CategoryPage />)

        await waitFor(() => {
            categoryProducts.forEach(product => {
                expect(screen.getByText(product.name)).toBeInTheDocument()
            })
        })
    })

    test('applies correct grid layout for products', async () => {
        render(<CategoryPage />)

        await waitFor(() => {
            const grid = screen.getByText(categoryProducts[0].name).closest('.grid')
            expect(grid).toHaveClass('lg:grid-cols-3')
            expect(grid).toHaveClass('sm:grid-cols-2')
            expect(grid).toHaveClass('grid-cols-1')
        })
    })

    test('handles non-existent category', async () => {
        jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({ slug: 'nonexistent' })

        render(<CategoryPage />)

        await waitFor(() => {
            expect(screen.getByText('Category not found')).toBeInTheDocument()
        })
    })

    test('renders product cards with all required information', async () => {
        render(<CategoryPage />)

        await waitFor(() => {
            const productCards = screen.getAllByTestId('product-card')
            expect(productCards.length).toBe(categoryProducts.length)
        })
    })
})