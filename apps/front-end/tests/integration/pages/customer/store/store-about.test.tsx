import { render, screen } from '@/tests/utils/test-utils'
import VendorAboutPage from '@/app/store/[username]/about/page'
import { mockVendors } from '@/tests/mocks/consumer-data'

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
    Award: () => <div data-testid="award-icon">🏆</div>,
    Users: () => <div data-testid="users-icon">👥</div>,
    Globe: () => <div data-testid("globe-icon">🌍</div>,
}))

describe('Vendor About Page', () => {
    const mockVendor = mockVendors[0]

    test('renders vendor information', () => {
        render(<VendorAboutPage params={{ username: mockVendor.slug }} />)

        expect(screen.getByText(mockVendor.name)).toBeInTheDocument()
        expect(screen.getByText(mockVendor.description)).toBeInTheDocument()
        expect(screen.getByText(`${mockVendor.followers.toLocaleString()} followers`)).toBeInTheDocument()
    })

    test('renders vendor stats', () => {
        render(<VendorAboutPage params={{ username: mockVendor.slug }} />)

        expect(screen.getByText('Years Active')).toBeInTheDocument()
        expect(screen.getByText('5+')).toBeInTheDocument()
        expect(screen.getByText('Customers')).toBeInTheDocument()
        expect(screen.getByText('50K+')).toBeInTheDocument()
        expect(screen.getByText('Countries')).toBeInTheDocument()
        expect(screen.getByText('15+')).toBeInTheDocument()
    })

    test('renders about section', () => {
        render(<VendorAboutPage params={{ username: mockVendor.slug }} />)

        expect(screen.getByText('About Us')).toBeInTheDocument()
    })

    test('renders contact section', () => {
        render(<VendorAboutPage params={{ username: mockVendor.slug }} />)

        expect(screen.getByText('Contact Us')).toBeInTheDocument()
        expect(screen.getByText(`contact@${mockVendor.slug}.local`)).toBeInTheDocument()
    })

    test('renders vendor logo', () => {
        render(<VendorAboutPage params={{ username: mockVendor.slug }} />)

        const logo = screen.getByAltText(mockVendor.name)
        expect(logo).toBeInTheDocument()
    })

    test('handles non-existent vendor', () => {
        jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({ username: 'nonexistent' })

        render(<VendorAboutPage params={{ username: 'nonexistent' }} />)

        expect(screen.getByText('Store not found')).toBeInTheDocument()
    })

    test('applies glass effect styling', () => {
        render(<VendorAboutPage params={{ username: mockVendor.slug }} />)

        const glassElements = screen.getAllByText('Years Active').map(el => el.closest('.glass'))
        expect(glassElements.length).toBeGreaterThan(0)
        expect(glassElements.every(el => el !== null)).toBe(true)
    })
})