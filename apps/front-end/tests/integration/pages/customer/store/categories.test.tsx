import { render, screen } from '@/tests/utils/test-utils'
import CategoriesPage from '@/app/categories/page'
import { mockCategories } from '@/tests/mocks/consumer-data'

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
    ArrowRight: () => <div data-testid="arrow-right">→</div>,
}))

describe('Categories Page', () => {
    test('renders page title and description', () => {
        render(<CategoriesPage />)

        expect(screen.getByText('Categories')).toBeInTheDocument()
        expect(screen.getByText('Browse products by category')).toBeInTheDocument()
    })

    test('renders all categories from mock data', () => {
        render(<CategoriesPage />)

        mockCategories.forEach(category => {
            expect(screen.getByText(category.name)).toBeInTheDocument()
        })
    })

    test('renders category cards with images', () => {
        render(<CategoriesPage />)

        mockCategories.forEach(category => {
            const categoryCard = screen.getByText(category.name).closest('a')
            expect(categoryCard).toHaveAttribute('href', `/categories/${category.slug}`)
        })
    })

    test('renders browse buttons for each category', () => {
        render(<CategoriesPage />)

        const browseButtons = screen.getAllByText('Browse')
        expect(browseButtons.length).toBe(mockCategories.length)
    })

    test('applies correct grid layout', () => {
        render(<CategoriesPage />)

        const grid = screen.getByText(mockCategories[0].name).closest('.grid')
        expect(grid).toHaveClass('lg:grid-cols-3')
        expect(grid).toHaveClass('md:grid-cols-2')
        expect(grid).toHaveClass('grid-cols-1')
    })

    test('applies hover effects to category cards', () => {
        render(<CategoriesPage />)

        const categoryCard = screen.getByText(mockCategories[0].name).closest('div')
        expect(categoryCard).toHaveClass('group')
        expect(categoryCard).toHaveClass('cursor-pointer')
    })
})