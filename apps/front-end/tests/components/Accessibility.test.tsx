import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import {
    Button,
    Input,
    ProductCard,
    AdminLayout,
    Footer,
    Navbar
} from '@/components'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

describe('Accessibility', () => {
    describe('Button', () => {
        it('has no accessibility violations', async () => {
            const { container } = render(<Button>Accessible Button</Button>)
            const results = await axe(container)
            expect(results).toHaveNoViolations()
        })

        it('has proper ARIA labels', () => {
            render(<Button aria-label="Submit form">Submit</Button>)
            expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Submit form')
        })

        it('handles disabled state accessibly', () => {
            render(<Button disabled>Disabled Button</Button>)
            const button = screen.getByRole('button')
            expect(button).toBeDisabled()
            expect(button).toHaveAttribute('aria-disabled', 'true')
        })
    })

    describe('Input', () => {
        it('has no accessibility violations', async () => {
            const { container } = render(<Input placeholder="Enter text" />)
            const results = await axe(container)
            expect(results).toHaveNoViolations()
        })

        it('has proper labels', () => {
            render(
                <div>
                    <label htmlFor="test-input">Test Label</label>
                    <Input id="test-input" />
                </div>
            )
            expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
        })

        it('handles error states accessibly', () => {
            render(<Input aria-invalid="true" aria-errormessage="error-message" />)
            const input = screen.getByRole('textbox')
            expect(input).toHaveAttribute('aria-invalid', 'true')
            expect(input).toHaveAttribute('aria-errormessage', 'error-message')
        })
    })

    describe('ProductCard', () => {
        const defaultProps = {
            id: '1',
            name: 'Accessible Product',
            slug: 'accessible-product',
            price: 99.99,
            originalPrice: 129.99,
            image: '/test.jpg',
            rating: 4.5,
            reviews: 123,
            vendor: 'Test Vendor',
            vendorSlug: 'test-vendor',
            inStock: true,
        }

        it('has no accessibility violations', async () => {
            const { container } = render(<ProductCard {...defaultProps} />)
            const results = await axe(container)
            expect(results).toHaveNoViolations()
        })

        it('has proper alt text for images', () => {
            render(<ProductCard {...defaultProps} />)
            const image = screen.getByAltText('Accessible Product')
            expect(image).toBeInTheDocument()
        })

        it('has proper semantic structure', () => {
            render(<ProductCard {...defaultProps} />)

            // Should have headings for product name
            const productName = screen.getByRole('heading', { name: /accessible product/i })
            expect(productName).toBeInTheDocument()

            // Price should be clearly marked
            expect(screen.getByText('$99.99')).toBeInTheDocument()
        })

        it('handles out of stock state accessibly', () => {
            render(<ProductCard {...defaultProps} inStock={false} />)

            const outOfStockText = screen.getByText('Out of Stock')
            expect(outOfStockText).toBeInTheDocument()

            const addToCartButton = screen.getByRole('button', { name: /add/i })
            expect(addToCartButton).toBeDisabled()
            expect(addToCartButton).toHaveAttribute('aria-disabled', 'true')
        })
    })

    describe('AdminLayout', () => {
        it('has no accessibility violations', async () => {
            const { container } = render(
                <AdminLayout>
                    <div>Content</div>
                </AdminLayout>
            )
            const results = await axe(container)
            expect(results).toHaveNoViolations()
        })

        it('has proper navigation landmarks', () => {
            render(
                <AdminLayout>
                    <div>Content</div>
                </AdminLayout>
            )

            // Should have navigation landmark
            const nav = screen.getByRole('navigation')
            expect(nav).toBeInTheDocument()

            // Should have main content landmark
            const main = screen.getByRole('main')
            expect(main).toBeInTheDocument()
        })

        it('has proper aria-labels for interactive elements', () => {
            render(
                <AdminLayout>
                    <div>Content</div>
                </AdminLayout>
            )

            const menuButton = screen.getByRole('button', { name: /menu/i })
            expect(menuButton).toBeInTheDocument()
        })
    })

    describe('Navbar', () => {
        it('has no accessibility violations', async () => {
            const { container } = render(<Navbar />)
            const results = await axe(container)
            expect(results).toHaveNoViolations()
        })

        it('has skip to content link', () => {
            render(<Navbar />)

            // Navbar should have a skip to main content link
            const skipLink = screen.queryByText(/skip to main content/i)
            expect(skipLink).toBeInTheDocument()
        })

        it('has proper ARIA labels for search', () => {
            render(<Navbar />)

            const searchInput = screen.getByPlaceholderText('Search products...')
            expect(searchInput).toHaveAttribute('aria-label', 'Search products')
        })
    })
})