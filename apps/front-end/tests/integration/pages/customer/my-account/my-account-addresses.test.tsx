import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import AddressesPage from '@/app/my-account/addresses/page'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Plus: () => <div data-testid="plus-icon">➕</div>,
    MapPin: () => <div data-testid="map-icon">📍</div>,
    Edit: () => <div data-testid="edit-icon">✏️</div>,
    Trash2: () => <div data-testid("trash-icon">🗑️</div>,
}))

describe('My Account Addresses Page', () => {
    const mockAddresses = [
        {
            id: '1',
            name: 'Home',
            address: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
            isDefault: true,
        },
        {
            id: '2',
            name: 'Work',
            address: '456 Market St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94103',
            isDefault: false,
        },
    ]

    test('renders addresses page title', () => {
        render(<AddressesPage />)

        expect(screen.getByText('Saved Addresses')).toBeInTheDocument()
    })

    test('renders add address button', () => {
        render(<AddressesPage />)

        expect(screen.getByText('Add Address')).toBeInTheDocument()
        expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    })

    test('renders all saved addresses', () => {
        render(<AddressesPage />)

        mockAddresses.forEach(address => {
            expect(screen.getByText(address.name)).toBeInTheDocument()
            expect(screen.getByText(address.address)).toBeInTheDocument()
            expect(screen.getByText(`${address.city}, ${address.state} ${address.zip}`)).toBeInTheDocument()
        })
    })

    test('marks default address correctly', () => {
        render(<AddressesPage />)

        const defaultBadge = screen.getByText('Default')
        expect(defaultBadge).toBeInTheDocument()
        expect(defaultBadge).toHaveClass('bg-blue-100', 'dark:bg-blue-900/30')
    })

    test('renders edit and delete buttons for each address', () => {
        render(<AddressesPage />)

        const editButtons = screen.getAllByTestId('edit-icon')
        const deleteButtons = screen.getAllByTestId('trash-icon')

        expect(editButtons.length).toBe(mockAddresses.length)
        expect(deleteButtons.length).toBe(mockAddresses.length)
    })

    test('applies correct grid layout', () => {
        render(<AddressesPage />)

        const grid = screen.getByText('Home').closest('.grid')
        expect(grid).toHaveClass('md:grid-cols-2')
        expect(grid).toHaveClass('grid-cols-1')
    })

    test('applies glass effect styling', () => {
        render(<AddressesPage />)

        const glassElements = screen.getAllByText('Home').map(el => el.closest('.glass'))
        expect(glassElements.length).toBeGreaterThan(0)
        expect(glassElements.every(el => el !== null)).toBe(true)
    })
})