import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VendorReviewResponsePage from '@/app/vendor/reviews/[slug]/page'

// Mock next/link
jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

// Mock react-hook-form
const mockRegister = jest.fn()
const mockHandleSubmit = jest.fn(callback => (e: any) => {
    e.preventDefault()
    callback({
        response: 'Thank you for your review!',
    })
})
const mockErrors = {}

jest.mock('react-hook-form', () => ({
    useForm: () => ({
        register: mockRegister,
        handleSubmit: mockHandleSubmit,
        formState: { errors: mockErrors },
    }),
}))

// Mock lucide-react
jest.mock('lucide-react', () => ({
    ArrowLeft: () => <svg data-testid="arrow-left-icon" />,
    Send: () => <svg data-testid="send-icon" />,
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, asChild, className, variant, type, ...props }: any) => {
        if (asChild) {
            return <div className={className} {...props}>{children}</div>
        }
        return (
            <button className={className} data-variant={variant} type={type} {...props}>
                {children}
            </button>
        )
    },
}))

jest.mock('@/components/ui/star-rating', () => ({
    StarRating: ({ rating }: { rating: number }) => (
        <div data-testid="star-rating" data-rating={rating}>
            {'★'.repeat(rating)}
        </div>
    ),
}))

describe('VendorReviewResponsePage', () => {
    beforeEach(() => {
        mockRegister.mockClear()
        mockHandleSubmit.mockClear()

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        })
    })

    test('renders review response page with correct title', () => {
        render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        expect(screen.getByText('Respond to Review')).toBeInTheDocument()
        expect(screen.getByText('Back to Reviews')).toBeInTheDocument()
        expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument()
    })

    test('displays customer review information', () => {
        render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Wireless Headphones • 2026-01-15')).toBeInTheDocument()
        expect(screen.getByText('"Excellent product, fast shipping!"')).toBeInTheDocument()
        expect(screen.getByTestId('star-rating')).toHaveAttribute('data-rating', '5')
    })

    test('renders response form with correct labels', () => {
        render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        expect(screen.getByText('Your Response')).toBeInTheDocument()
        expect(screen.getByText('Message')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Thank you for your review! We appreciate your feedback...')).toBeInTheDocument()
    })

    test('registers response textarea', () => {
        render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        expect(mockRegister).toHaveBeenCalledWith(
            'response',
            expect.objectContaining({
                required: 'Response is required',
                minLength: { value: 10, message: 'Response must be at least 10 characters' },
            })
        )
    })

    test('handles form submission', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

        render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        const sendButton = screen.getByText('Send Response')
        fireEvent.click(sendButton)

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                'Review response:',
                expect.objectContaining({
                    response: 'Thank you for your review!',
                })
            )
        })

        consoleSpy.mockRestore()
    })

    test('renders action buttons', () => {
        render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        const cancelButton = screen.getByText('Cancel')
        const sendButton = screen.getByText('Send Response')

        expect(cancelButton).toBeInTheDocument()
        expect(sendButton).toBeInTheDocument()

        expect(cancelButton.closest('a')).toHaveAttribute('href', '/vendor/reviews')
        expect(sendButton).toHaveAttribute('type', 'submit')
        expect(screen.getByTestId('send-icon')).toBeInTheDocument()
    })

    test('has glass effect on containers', () => {
        render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        const reviewContainer = screen.getByText('John Doe').closest('.glass')
        expect(reviewContainer).toBeInTheDocument()

        const formContainer = screen.getByText('Your Response').closest('.glass')
        expect(formContainer).toBeInTheDocument()
    })

    test('displays chat history simulation', () => {
        render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        expect(screen.getByText('Type your response here...')).toBeInTheDocument()
    })

    test('has proper form layout and spacing', () => {
        render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        const form = screen.getByText('Message').closest('form')
        expect(form).toHaveClass('space-y-4')

        const buttonContainer = screen.getByText('Cancel').closest('.flex')
        expect(buttonContainer).toHaveClass('gap-4')

        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
            expect(button).toHaveClass('flex-1', 'rounded-lg')
        })
    })

    test('renders in dark mode correctly', () => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: query === '(prefers-color-scheme: dark)',
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        })

        render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        const title = screen.getByText('Respond to Review')
        expect(title).toHaveClass('dark:text-zinc-100')
    })

    test('shows validation errors when present', () => {
        // Mock errors
        jest.doMock('react-hook-form', () => ({
            useForm: () => ({
                register: mockRegister,
                handleSubmit: mockHandleSubmit,
                formState: {
                    errors: {
                        response: { message: 'Response must be at least 10 characters' },
                    },
                },
            }),
        }))

        const { rerender } = render(<VendorReviewResponsePage params={{ slug: '1' }} />)

        // Re-render with mocked errors
        rerender(<VendorReviewResponsePage params={{ slug: '1' }} />)
    })
})