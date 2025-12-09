import { render, screen } from '@/tests/utils/test-utils'
import ReviewsPage from '@/app/my-account/reviews/page'

describe('My Account Reviews Page', () => {
    const mockReviews = [
        {
            id: '1',
            productName: 'Premium Wireless Headphones',
            rating: 5,
            comment: 'Excellent quality and amazing sound. Highly recommend!',
            date: '2026-01-10',
        },
        {
            id: '2',
            productName: 'Organic Cotton T-Shirt',
            rating: 4,
            comment: 'Great fit but took longer to arrive than expected.',
            date: '2026-01-05',
        },
    ]

    test('renders reviews page title', () => {
        render(<ReviewsPage />)

        expect(screen.getByText('My Reviews')).toBeInTheDocument()
    })

    test('renders all user reviews', () => {
        render(<ReviewsPage />)

        mockReviews.forEach(review => {
            expect(screen.getByText(review.productName)).toBeInTheDocument()
            expect(screen.getByText(review.comment)).toBeInTheDocument()
            expect(screen.getByText(`Reviewed on ${review.date}`)).toBeInTheDocument()
        })
    })

    test('renders star ratings for each review', () => {
        render(<ReviewsPage />)

        const starRatings = screen.getAllByTestId('star-rating')
        expect(starRatings.length).toBe(mockReviews.length)

        mockReviews.forEach((review, index) => {
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
            expect(starRatings[index].textContent).toBe(stars)
        })
    })

    test('applies glass effect styling', () => {
        render(<ReviewsPage />)

        const glassElements = screen.getAllByText(mockReviews[0].productName).map(el => el.closest('.glass'))
        expect(glassElements.length).toBeGreaterThan(0)
        expect(glassElements.every(el => el !== null)).toBe(true)
    })

    test('displays review dates in proper format', () => {
        render(<ReviewsPage />)

        mockReviews.forEach(review => {
            expect(screen.getByText(`Reviewed on ${review.date}`)).toHaveClass('text-xs')
            expect(screen.getByText(`Reviewed on ${review.date}`)).toHaveClass('text-zinc-600', 'dark:text-zinc-400')
        })
    })
})