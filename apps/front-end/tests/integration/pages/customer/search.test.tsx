import { render, screen, waitFor } from '@/tests/utils/test-utils'
import SearchPage from '@/app/search/page'
import { mockProducts } from '@/tests/mocks/consumer-data'

// Mock useSearchParams
const mockSearchParams = new URLSearchParams('?q=Wireless')
jest.mock('next/navigation', () => ({
    useSearchParams: () => mockSearchParams,
}))

describe('Search Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders search results title with query', () => {
        render(<SearchPage />)

        expect(screen.getByText('Search Results')).toBeInTheDocument()
        expect(screen.getByText(`results found for "Wireless"`)).toBeInTheDocument()
    })

    test('renders matching products', () => {
        render(<SearchPage />)

        const matchingProducts = mockProducts.filter(p =>
            p.name.toLowerCase().includes('wireless') ||
            p.description.toLowerCase().includes('wireless')
        )

        matchingProducts.forEach(product => {
            expect(screen.getByText(product.name)).toBeInTheDocument()
        })
    })

    test('displays correct result count', () => {
        render(<SearchPage />)

        const matchingProducts = mockProducts.filter(p =>
            p.name.toLowerCase().includes('wireless') ||
            p.description.toLowerCase().includes('wireless')
        )

        expect(screen.getByText(`${matchingProducts.length} results found for "Wireless"`)).toBeInTheDocument()
    })

    test('renders empty state for no results', () => {
        mockSearchParams.set('q', 'NonexistentProduct')

        render(<SearchPage />)

        expect(screen.getByText('No products found matching your search.')).toBeInTheDocument()
    })

    test('applies correct grid layout for results', () => {
        mockSearchParams.set('q', 'Wireless')

        render(<SearchPage />)

        const grid = screen.getByText(mockProducts[0].name).closest('.grid')
        expect(grid).toHaveClass('lg:grid-cols-3')
        expect(grid).toHaveClass('sm:grid-cols-2')
        expect(grid).toHaveClass('grid-cols-1')
    })

    test('handles empty search query', () => {
        mockSearchParams.delete('q')

        render(<SearchPage />)

        expect(screen.getByText('Search Results')).toBeInTheDocument()
    })
})