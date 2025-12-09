import { render, screen } from '@/tests/utils/test-utils'
import AboutPage from '@/app/about/page'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Heart: () => <div data-testid="heart-icon">❤️</div>,
    Users: () => <div data-testid="users-icon">👥</div>,
    Zap: () => <div data-testid="zap-icon">⚡</div>,
    ArrowRight: () => <div data-testid="arrow-right">→</div>,
}))

describe('About Page', () => {
    test('renders page title and mission statement', () => {
        render(<AboutPage />)

        expect(screen.getByText('About Us')).toBeInTheDocument()
        expect(screen.getByText("We're building the future of multi-vendor e-commerce")).toBeInTheDocument()
        expect(screen.getByText('Our Mission')).toBeInTheDocument()
    })

    test('renders all value proposition cards', () => {
        render(<AboutPage />)

        const values = [
            'Community First',
            'Fast & Reliable',
            'Customer Care'
        ]

        values.forEach(value => {
            expect(screen.getByText(value)).toBeInTheDocument()
        })
    })

    test('renders CTA button with correct link', () => {
        render(<AboutPage />)

        const ctaButton = screen.getByText('Start Exploring')
        expect(ctaButton).toBeInTheDocument()
        expect(ctaButton.closest('a')).toHaveAttribute('href', '/shop')
    })

    test('applies correct grid layout for value cards', () => {
        render(<AboutPage />)

        const grid = screen.getByText('Community First').closest('.grid')
        expect(grid).toHaveClass('md:grid-cols-3')
        expect(grid).toHaveClass('grid-cols-1')
    })

    test('has proper glass effect styling', () => {
        render(<AboutPage />)

        const glassElements = screen.getAllByText('Community First').map(el => el.closest('.glass'))
        expect(glassElements.length).toBeGreaterThan(0)
        expect(glassElements.every(el => el !== null)).toBe(true)
    })
})