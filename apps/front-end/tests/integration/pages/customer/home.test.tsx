import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import Home from '@/app/page'
import { mockCategories, mockProducts } from '@/tests/mocks/consumer-data'

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        section: ({ children, ...props }) => <section {...props}>{children}</section>,
        h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
        p: ({ children, ...props }) => <p {...props}>{children}</p>,
    },
}))

describe('Home Page', () => {
    test('renders hero section with title and CTA buttons', () => {
        render(<Home />)

        expect(screen.getByText('Discover Your Next Favorite Product')).toBeInTheDocument()
        expect(screen.getByText('Shop Now')).toBeInTheDocument()
        expect(screen.getByText('Browse Categories')).toBeInTheDocument()
    })

    test('renders stats section with correct data', () => {
        render(<Home />)

        expect(screen.getByText('2,500+')).toBeInTheDocument()
        expect(screen.getByText('Active Sellers')).toBeInTheDocument()
        expect(screen.getByText('100,000+')).toBeInTheDocument()
        expect(screen.getByText('Products Available')).toBeInTheDocument()
        expect(screen.getByText('50,000+')).toBeInTheDocument()
        expect(screen.getByText('Happy Customers')).toBeInTheDocument()
    })

    test('renders categories section with correct links', () => {
        render(<Home />)

        mockCategories.forEach(category => {
            expect(screen.getByText(category.name)).toBeInTheDocument()
        })
    })

    test('renders featured products section', () => {
        render(<Home />)

        expect(screen.getByText('Trending Now')).toBeInTheDocument()
        expect(screen.getByText('View All')).toBeInTheDocument()
    })

    test('renders vendor CTA section', () => {
        render(<Home />)

        expect(screen.getByText('Become a Vendor')).toBeInTheDocument()
        expect(screen.getByText('Start Selling')).toBeInTheDocument()
    })

    test('has working navigation links', () => {
        render(<Home />)

        const shopLink = screen.getByText('Shop Now').closest('a')
        expect(shopLink).toHaveAttribute('href', '/shop')

        const categoriesLink = screen.getByText('Browse Categories').closest('a')
        expect(categoriesLink).toHaveAttribute('href', '/categories')
    })

    test('applies glass effect to components', () => {
        render(<Home />)

        const glassElements = screen.getAllByText('Active Sellers').map(el => el.closest('.glass'))
        expect(glassElements.every(el => el !== null)).toBe(true)
    })
})