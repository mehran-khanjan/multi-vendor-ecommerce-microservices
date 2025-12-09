import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import VendorReviewsPage from '@/app/vendor/reviews/page'

// Mock next/link
jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

// Mock lucide-react
jest.mock('lucide-react', () => ({
    MessageCircle: () => <svg data-testid="message-circle-icon" />,
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, asChild, className, variant, size, ...props }: any) => {
        if (asChild) {
            return <div className={className} {...props}>{children}</div>
        }
        return (
            <button className={className} data-variant={variant} data-size={size} {...props}>
                {children}
            </button>
        )
    },
}))

jest.mock('@/components/ui/star-rating', () => ({
    StarRating: ({ rating }: { rating: number }) => (
        <div data-testid="star-rating" data-rating={rating}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
        </div>
    ),
}))

describe('VendorReviewsPage', () => {
    beforeEach(() => {
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

    test('renders reviews page with correct title', () => {
        render(<VendorReviewsPage />)

        expect(screen.getByText('Reviews')).toBeInTheDocument()
        expect(screen.getByText('Manage customer reviews and respond to feedback')).toBeInTheDocument()
    })

    test('renders all reviews with correct data', () => {
        render(<VendorReviewsPage />)

        const reviews = [
            { customer: 'John Doe', rating: 5, product: 'Wireless Headphones', comment: 'Excellent product, fast shipping!', date: '2026-01-15' },
            { customer: 'Jane Smith', rating: 4, product: 'USB Cable', comment: 'Good quality but could be cheaper', date: '2026-01-10' },
            { customer: 'Bob Johnson', rating: 5, product: 'Phone Case', comment: 'Perfect fit and great protection', date: '2026-01-08' },
        ]

        reviews.forEach(review => {
            expect(screen.getByText(review.customer)).toBeInTheDocument()
            expect(screen.getByText(review.product)).toBeInTheDocument()
            expect(screen.getByText(review.comment)).toBeInTheDocument()
            expect(screen.getByText(review.date)).toBeInTheDocument()
        })
    })

    test('renders star ratings correctly', () => {
        render(<VendorReviewsPage />)

        const starRatings = screen.getAllByTestId('star-rating')
        expect(starRatings).toHaveLength(3)

        expect(starRatings[0]).toHaveAttribute('data-rating', '5')
        expect(starRatings[1]).toHaveAttribute('data-rating', '4')
        expect(starRatings[2]).toHaveAttribute('data-rating', '5')
    })

    test('renders respond buttons with correct links', () => {
        render(<VendorReviewsPage />)

        const respondButtons = screen.getAllByText('Respond')
        expect(respondButtons).toHaveLength(3)

        respondButtons.forEach((button, index) => {
            expect(button.closest('a')).toHaveAttribute('href', `/vendor/reviews/${index + 1}`)
            expect(screen.getAllByTestId('message-circle-icon')[index]).toBeInTheDocument()
        })
    })

    test('has glass effect on review cards', () => {
        render(<VendorReviewsPage />)

        const reviewCards = screen.getAllByText(/John Doe|Jane Smith|Bob Johnson/)
        reviewCards.forEach(card => {
            expect(card.closest('.glass')).toBeInTheDocument()
        })
    })

    test('has proper review card layout', () => {
        render(<VendorReviewsPage />)

        const reviewCards = screen.getAllByText(/John Doe|Jane Smith|Bob Johnson/)
        reviewCards.forEach(card => {
            const container = card.closest('.space-y-4')
            expect(container).toBeInTheDocument()
        })
    })

    test('displays review dates correctly', () => {
        render(<VendorReviewsPage />)

        const dates = screen.getAllByText(/\d{4}-\d{2}-\d{2}/)
        expect(dates).toHaveLength(3)

        dates.forEach(date => {
            expect(date).toHaveClass('text-xs', 'text-zinc-600', 'dark:text-zinc-400')
        })
    })

    test('has proper spacing between review elements', () => {
        render(<VendorReviewsPage />)

        const reviewContainers = screen.getAllByText(/Excellent product|Good quality|Perfect fit/)
        reviewContainers.forEach(container => {
            expect(container).toHaveClass('mb-4')
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

        render(<VendorReviewsPage />)

        const title = screen.getByText('Reviews')
        expect(title).toHaveClass('dark:text-zinc-100')
    })

    test('has accessible contrast for review text', () => {
        render(<VendorReviewsPage />)

        const reviewComments = screen.getAllByText(/Excellent product|Good quality|Perfect fit/)
        reviewComments.forEach(comment => {
            expect(comment).toHaveClass('text-zinc-600', 'dark:text-zinc-400')
        })
    })

    test('respond buttons have correct styling', () => {
        render(<VendorReviewsPage />)

        const respondButtons = screen.getAllByText('Respond')
        respondButtons.forEach(button => {
            expect(button.closest('button')).toHaveAttribute('data-variant', 'outline')
            expect(button.closest('button')).toHaveAttribute('data-size', 'sm')
            expect(button.closest('button')).toHaveClass('gap-2', 'rounded-lg', 'bg-transparent')
        })
    })
})