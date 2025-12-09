import { render, screen } from '@/tests/utils/test-utils'
import VendorStorePage from '@/app/store/[username]/page'
import { mockVendors, mockProducts } from '@/tests/mocks/consumer-data'

// Mock useParams
jest.mock('next/navigation', () => ({
    useParams: () => ({ username: 'techcorp' }),
}))

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
    ShoppingBag: () => <div data-testid="shopping-bag-icon">🛍️</div>,
}))

describe('Vendor Store Page', () => {
    const mockVendor = mockVendors[0]
    const vendorProducts = mockProducts.filter(p => p.vendorSlug === mockVendor.slug)

    test('renders vendor information', () => {
        render(<VendorStorePage params={{ username: mockVendor.slug }} />)

        expect(screen.getByText(mockVendor.name)).toBeInTheDocument()
        expect(screen.getByText(mockVendor.description)).toBeInTheDocument()
        expect(screen.getByText(`${vendorProducts.length} products`)).toBeInTheDocument()
        expect(screen.getByText(`${mockVendor.followers.toLocaleString()} followers`)).toBeInTheDocument()
    })

    test('renders follow store button', () => {
        render(<VendorStorePage params={{ username: mockVendor.slug }} />)

        expect(screen.getByText('Follow Store')).toBeInTheDocument()
    })

    test('renders vendor products', () => {
        render(<VendorStorePage params={{ username: mockVendor.slug }} />)

        vendorProducts.forEach(product => {
            expect(screen.getByText(product.name)).toBeInTheDocument()
        })
    })

    test('displays empty state for vendor with no products', () => {
        const emptyVendor = { ...mockVendors[1], slug: 'emptyvendor' }
        jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({ username: emptyVendor.slug })

        render(<VendorStorePage params={{ username: emptyVendor.slug }} />)

        expect(screen.getByText('This store has no products yet.')).toBeInTheDocument()
    })

    test('applies gradient background to header', () => {
        render(<VendorStorePage params={{ username: mockVendor.slug }} />)

        const header = screen.getByText(mockVendor.name).closest('div')
        expect(header).toHaveClass('bg-gradient-to-r')
    })

    test('renders vendor logo', () => {
        render(<VendorStorePage params={{ username: mockVendor.slug }} />)

        const logo = screen.getByAltText(mockVendor.name)
        expect(logo).toBeInTheDocument()
    })

    test('handles non-existent vendor', () => {
        jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({ username: 'nonexistent' })

        render(<VendorStorePage params={{ username: 'nonexistent' }} />)

        expect(screen.getByText('Store not found')).toBeInTheDocument()
    })
})