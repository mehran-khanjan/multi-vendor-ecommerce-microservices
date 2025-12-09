import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import CheckoutPage from '@/app/checkout/page'
import { useRouter } from 'next/navigation'

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    ArrowRight: () => <div data-testid="arrow-right">→</div>,
    Check: () => <div data-testid="check-icon">✓</div>,
}))

describe('Checkout Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders progress bar with three steps', () => {
        render(<CheckoutPage />)

        expect(screen.getByText('Shipping')).toBeInTheDocument()
        expect(screen.getByText('Payment')).toBeInTheDocument()
        expect(screen.getByText('Review')).toBeInTheDocument()
    })

    test('starts at shipping step', () => {
        render(<CheckoutPage />)

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument()
    })

    test('validates shipping form fields', async () => {
        render(<CheckoutPage />)

        const submitButton = screen.getByText('Continue to Payment')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Email is required')).toBeInTheDocument()
            expect(screen.getByText('First name is required')).toBeInTheDocument()
            expect(screen.getByText('Last name is required')).toBeInTheDocument()
        })
    })

    test('proceeds to payment step on valid shipping form', async () => {
        render(<CheckoutPage />)

        // Fill shipping form
        fireEvent.change(screen.getByPlaceholderText('john@example.com'), {
            target: { value: 'test@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('John'), {
            target: { value: 'John' },
        })
        fireEvent.change(screen.getByPlaceholderText('Doe'), {
            target: { value: 'Doe' },
        })
        fireEvent.change(screen.getByPlaceholderText('123 Main St'), {
            target: { value: '123 Test St' },
        })
        fireEvent.change(screen.getByPlaceholderText('San Francisco'), {
            target: { value: 'Test City' },
        })
        fireEvent.change(screen.getByPlaceholderText('CA'), {
            target: { value: 'TC' },
        })
        fireEvent.change(screen.getByPlaceholderText('94102'), {
            target: { value: '12345' },
        })
        fireEvent.change(screen.getByPlaceholderText('+1 (555) 000-0000'), {
            target: { value: '+1234567890' },
        })

        const submitButton = screen.getByText('Continue to Payment')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Payment Method')).toBeInTheDocument()
        })
    })

    test('renders order summary with correct calculations', () => {
        render(<CheckoutPage />)

        expect(screen.getByText('Order Summary')).toBeInTheDocument()
        expect(screen.getByText('Subtotal')).toBeInTheDocument()
        expect(screen.getByText('Shipping')).toBeInTheDocument()
        expect(screen.getByText('Tax')).toBeInTheDocument()
        expect(screen.getByText('Total')).toBeInTheDocument()
    })

    test('validates payment form fields', async () => {
        render(<CheckoutPage />)

        // First navigate to payment step
        fireEvent.change(screen.getByPlaceholderText('john@example.com'), {
            target: { value: 'test@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('John'), {
            target: { value: 'John' },
        })
        fireEvent.change(screen.getByPlaceholderText('Doe'), {
            target: { value: 'Doe' },
        })
        // ... fill other required fields

        fireEvent.click(screen.getByText('Continue to Payment'))

        await waitFor(() => {
            const submitPayment = screen.getByText('Review Order')
            fireEvent.click(submitPayment)

            expect(screen.getByText('Card number is required')).toBeInTheDocument()
        })
    })

    test('allows navigation back from payment to shipping', async () => {
        render(<CheckoutPage />)

        // Navigate to payment
        fireEvent.change(screen.getByPlaceholderText('john@example.com'), {
            target: { value: 'test@example.com' },
        })
        // ... fill other fields

        fireEvent.click(screen.getByText('Continue to Payment'))

        await waitFor(() => {
            const backButton = screen.getByText('Back')
            fireEvent.click(backButton)

            expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        })
    })

    test('renders review step with shipping information', async () => {
        render(<CheckoutPage />)

        // Fill and submit shipping
        // Fill and submit payment
        // Navigate to review

        await waitFor(() => {
            expect(screen.getByText('Review Your Order')).toBeInTheDocument()
            expect(screen.getByText('Shipping To:')).toBeInTheDocument()
            expect(screen.getByText('Items:')).toBeInTheDocument()
        })
    })
})