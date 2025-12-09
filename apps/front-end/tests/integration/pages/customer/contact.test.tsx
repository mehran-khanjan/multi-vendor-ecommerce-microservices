import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import ContactPage from '@/app/contact/page'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Mail: () => <div data-testid="mail-icon">📧</div>,
    Phone: () => <div data-testid="phone-icon">📱</div>,
    MapPin: () => <div data-testid("map-icon">📍</div>,
}))

describe('Contact Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders page title and description', () => {
        render(<ContactPage />)

        expect(screen.getByText('Contact Us')).toBeInTheDocument()
        expect(screen.getByText("We'd love to hear from you")).toBeInTheDocument()
    })

    test('renders contact information cards', () => {
        render(<ContactPage />)

        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getByText('support@ecommerce.com')).toBeInTheDocument()
        expect(screen.getByText('Phone')).toBeInTheDocument()
        expect(screen.getByText('+1 (555) 000-0000')).toBeInTheDocument()
        expect(screen.getByText('Address')).toBeInTheDocument()
        expect(screen.getByText('123 Commerce St, San Francisco, CA')).toBeInTheDocument()
    })

    test('renders contact form with all fields', () => {
        render(<ContactPage />)

        expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Message subject')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Your message...')).toBeInTheDocument()
        expect(screen.getByText('Send Message')).toBeInTheDocument()
    })

    test('validates required form fields', async () => {
        render(<ContactPage />)

        const submitButton = screen.getByText('Send Message')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Name is required')).toBeInTheDocument()
            expect(screen.getByText('Email is required')).toBeInTheDocument()
            expect(screen.getByText('Subject is required')).toBeInTheDocument()
            expect(screen.getByText('Message is required')).toBeInTheDocument()
        })
    })

    test('validates email format', async () => {
        render(<ContactPage />)

        const emailInput = screen.getByPlaceholderText('your@email.com')
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
        fireEvent.blur(emailInput)

        const submitButton = screen.getByText('Send Message')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Invalid email')).toBeInTheDocument()
        })
    })

    test('validates message length', async () => {
        render(<ContactPage />)

        const messageInput = screen.getByPlaceholderText('Your message...')
        fireEvent.change(messageInput, { target: { value: 'Short' } })
        fireEvent.blur(messageInput)

        const submitButton = screen.getByText('Send Message')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Message must be at least 10 characters')).toBeInTheDocument()
        })
    })

    test('applies correct grid layout', () => {
        render(<ContactPage />)

        const grid = screen.getByText('Email').closest('.grid')
        expect(grid).toHaveClass('lg:grid-cols-3')
    })

    test('applies glass effect styling', () => {
        render(<ContactPage />)

        const glassElements = screen.getAllByText('Email').map(el => el.closest('.glass'))
        expect(glassElements.length).toBeGreaterThan(0)
        expect(glassElements.every(el => el !== null)).toBe(true)
    })
})