import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import AdminCategoriesPage from '@/app/admin/categories/page'
import { mockCategories } from '@/tests/mocks/lib/mock-data'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Plus: () => <div data-testid="plus-icon">+</div>,
    Edit: () => <div data-testid="edit-icon">Edit</div>,
    Trash2: () => <div data-testid="trash-icon">Delete</div>,
}))

// Mock the button component to simplify testing
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, className, variant }: any) => (
        <button
            onClick={onClick}
            className={className}
            data-variant={variant}
            data-testid="button"
        >
            {children}
        </button>
    ),
}))

describe('AdminCategoriesPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders page title and category count', () => {
        render(<AdminCategoriesPage />)

        expect(screen.getByText('Categories')).toBeInTheDocument()
        expect(screen.getByText(`Manage ${mockCategories.length} categories`)).toBeInTheDocument()
    })

    test('renders all categories from mock data', () => {
        render(<AdminCategoriesPage />)

        mockCategories.forEach(category => {
            expect(screen.getByText(category.name)).toBeInTheDocument()
        })
    })

    test('renders Add Category button with icon', () => {
        render(<AdminCategoriesPage />)

        const addButton = screen.getByText('Add Category')
        expect(addButton).toBeInTheDocument()
        expect(addButton.closest('button')).toBeInTheDocument()
    })

    test('renders edit and delete buttons for each category', () => {
        render(<AdminCategoriesPage />)

        const editButtons = screen.getAllByTestId('edit-icon')
        const deleteButtons = screen.getAllByTestId('trash-icon')

        expect(editButtons).toHaveLength(mockCategories.length)
        expect(deleteButtons).toHaveLength(mockCategories.length)
    })

    test('applies correct grid layout for categories', () => {
        render(<AdminCategoriesPage />)

        const grid = screen.getByText(mockCategories[0].name).closest('.grid')
        expect(grid).toHaveClass('lg:grid-cols-3')
        expect(grid).toHaveClass('md:grid-cols-2')
        expect(grid).toHaveClass('grid-cols-1')
    })

    test('handles category card click', () => {
        render(<AdminCategoriesPage />)

        const firstCategory = screen.getByText(mockCategories[0].name)
        expect(firstCategory).toBeInTheDocument()

        // Simulate hover effect check
        const categoryCard = firstCategory.closest('.glass')
        expect(categoryCard).toHaveClass('rounded-xl')
    })
})