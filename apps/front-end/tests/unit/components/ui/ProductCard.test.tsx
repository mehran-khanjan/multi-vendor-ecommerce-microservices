import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '@/components/ui/product-card'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

describe('ProductCard', () => {
    const mockRouterPush = jest.fn()
    const defaultProps = {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        price: 99.99,
        originalPrice: 129.99,
        image: '/test-image.jpg',
        rating: 4.5,
        reviews: 123,
        vendor: 'Test Vendor',
        vendorSlug: 'test-vendor',
        inStock: true,
    }

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({
            push: mockRouterPush,
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders correctly with all product information', () => {
        render(<ProductCard {...defaultProps} />)

        expect(screen.getByText('Test Product')).toBeInTheDocument()
        expect(screen.getByText('Test Vendor')).toBeInTheDocument()
        expect(screen.getByText('$99.99')).toBeInTheDocument()
        expect(screen.getByText('$129.99')).toBeInTheDocument()
        expect(screen.getByText('4.5')).toBeInTheDocument()
        expect(screen.getByText('(123 reviews)')).toBeInTheDocument()
    })

    it('shows discount badge when original price is higher', () => {
        render(<ProductCard {...defaultProps} />)

        const discountBadge = screen.getByText(/-23%/i)
        expect(discountBadge).toBeInTheDocument()
        expect(discountBadge).toHaveClass('bg-red-600')
    })

    it('does not show discount badge when prices are equal', () => {
        const props = { ...defaultProps, originalPrice: 99.99 }
        render(<ProductCard {...props} />)

        const discountBadge = screen.queryByText(/-/i)
        expect(discountBadge).not.toBeInTheDocument()
    })

    it('shows out of stock overlay when inStock is false', () => {
        render(<ProductCard {...defaultProps} inStock={false} />)

        expect(screen.getByText('Out of Stock')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /add/i })).toBeDisabled()
    })

    it('toggles wishlist state when heart button is clicked', () => {
        render(<ProductCard {...defaultProps} />)

        const wishlistButton = screen.getByRole('button', { name: /wishlist/i })
        fireEvent.click(wishlistButton)

        // Heart should be filled
        const heartIcon = wishlistButton.querySelector('svg')
        expect(heartIcon).toHaveClass('fill-red-600')
    })

    it('navigates to product page when card is clicked', () => {
        render(<ProductCard {...defaultProps} />)

        const productLink = screen.getByText('Test Product').closest('a')
        expect(productLink).toHaveAttribute('href', '/shop/test-product')
    })

    it('has hover animation on image', () => {
        render(<ProductCard {...defaultProps} />)

        const card = screen.getByText('Test Product').closest('[class*="group"]')
        expect(card).toBeInTheDocument()
    })

    it('truncates long product names', () => {
        const longName = 'Very Long Product Name That Should Be Truncated After Two Lines'
        render(<ProductCard {...defaultProps} name={longName} />)

        const productName = screen.getByText(longName)
        expect(productName).toHaveClass('line-clamp-2')
    })

    it('handles add to cart button click', () => {
        render(<ProductCard {...defaultProps} />)

        const addToCartButton = screen.getByRole('button', { name: /add/i })
        fireEvent.click(addToCartButton)

        // Add your cart logic test here
        // This would typically test a cart context or API call
    })

    it('shows correct rating stars', () => {
        render(<ProductCard {...defaultProps} rating={3.5} />)

        const stars = screen.getAllByTestId('star-icon')
        expect(stars).toHaveLength(5)

        // First 3 stars should be filled
        expect(stars[0]).toHaveClass('fill-yellow-400')
        expect(stars[1]).toHaveClass('fill-yellow-400')
        expect(stars[2]).toHaveClass('fill-yellow-400')
        expect(stars[3]).not.toHaveClass('fill-yellow-400')
    })
})