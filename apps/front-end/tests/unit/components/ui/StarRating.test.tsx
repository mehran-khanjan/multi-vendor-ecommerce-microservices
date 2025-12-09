import React from 'react'
import { render, screen } from '@testing-library/react'
import { StarRating } from '@/components/ui/star-rating'

describe('StarRating', () => {
    it('renders correct number of stars', () => {
        render(<StarRating rating={3.5} />)

        const stars = screen.getAllByTestId('star-icon')
        expect(stars).toHaveLength(5)
    })

    it('shows correct filled stars based on rating', () => {
        const { rerender } = render(<StarRating rating={1} />)

        let stars = screen.getAllByTestId('star-icon')
        expect(stars[0]).toHaveClass('fill-yellow-400')
        expect(stars[1]).not.toHaveClass('fill-yellow-400')
        expect(stars[2]).not.toHaveClass('fill-yellow-400')
        expect(stars[3]).not.toHaveClass('fill-yellow-400')
        expect(stars[4]).not.toHaveClass('fill-yellow-400')

        rerender(<StarRating rating={4.5} />)
        stars = screen.getAllByTestId('star-icon')
        expect(stars[0]).toHaveClass('fill-yellow-400')
        expect(stars[1]).toHaveClass('fill-yellow-400')
        expect(stars[2]).toHaveClass('fill-yellow-400')
        expect(stars[3]).toHaveClass('fill-yellow-400')
        expect(stars[4]).not.toHaveClass('fill-yellow-400')
    })

    it('shows reviews count when provided', () => {
        render(<StarRating rating={4.5} reviews={123} />)

        expect(screen.getByText('4.5')).toBeInTheDocument()
        expect(screen.getByText('(123 reviews)')).toBeInTheDocument()
    })

    it('does not show reviews count when not provided', () => {
        render(<StarRating rating={4.5} />)

        expect(screen.queryByText(/reviews/i)).not.toBeInTheDocument()
    })

    it('renders with different sizes', () => {
        const { rerender } = render(<StarRating rating={3} size="sm" />)
        let stars = screen.getAllByTestId('star-icon')
        expect(stars[0]).toHaveClass('w-3', 'h-3')

        rerender(<StarRating rating={3} size="md" />)
        stars = screen.getAllByTestId('star-icon')
        expect(stars[0]).toHaveClass('w-4', 'h-4')

        rerender(<StarRating rating={3} size="lg" />)
        stars = screen.getAllByTestId('star-icon')
        expect(stars[0]).toHaveClass('w-5', 'h-5')
    })

    it('handles edge cases for rating', () => {
        const { rerender } = render(<StarRating rating={0} />)
        let stars = screen.getAllByTestId('star-icon')
        stars.forEach(star => {
            expect(star).not.toHaveClass('fill-yellow-400')
        })

        rerender(<StarRating rating={5} />)
        stars = screen.getAllByTestId('star-icon')
        stars.forEach(star => {
            expect(star).toHaveClass('fill-yellow-400')
        })

        rerender(<StarRating rating={-1} />)
        stars = screen.getAllByTestId('star-icon')
        stars.forEach(star => {
            expect(star).not.toHaveClass('fill-yellow-400')
        })

        rerender(<StarRating rating={6} />)
        stars = screen.getAllByTestId('star-icon')
        stars.forEach(star => {
            expect(star).toHaveClass('fill-yellow-400')
        })
    })
})