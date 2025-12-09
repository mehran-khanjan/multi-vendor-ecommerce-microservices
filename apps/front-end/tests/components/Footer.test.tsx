import React from 'react'
import { render, screen } from '@testing-library/react'
import { Footer } from '@/layout/Footer'

describe('Footer', () => {
    it('renders correctly with all sections', () => {
        render(<Footer />)

        // Brand section
        expect(screen.getByText('E-Commerce')).toBeInTheDocument()
        expect(
            screen.getByText('Modern multi-vendor e-commerce platform for seamless shopping.')
        ).toBeInTheDocument()

        // Shop links
        expect(screen.getByText('Shop')).toBeInTheDocument()
        expect(screen.getByText('Products')).toBeInTheDocument()
        expect(screen.getByText('Categories')).toBeInTheDocument()
        expect(screen.getByText('Best Sellers')).toBeInTheDocument()

        // Support links
        expect(screen.getByText('Support')).toBeInTheDocument()
        expect(screen.getByText('Help Center')).toBeInTheDocument()
        expect(screen.getByText('Contact Us')).toBeInTheDocument()
        expect(screen.getByText('FAQ')).toBeInTheDocument()

        // Contact information
        expect(screen.getByText('Contact')).toBeInTheDocument()
        expect(screen.getByText('hello@ecommerce.local')).toBeInTheDocument()
        expect(screen.getByText('+1 (555) 000-0000')).toBeInTheDocument()
        expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()

        // Footer bottom
        expect(screen.getByText(/© 2026 E-Commerce\. All rights reserved\./)).toBeInTheDocument()
        expect(screen.getByText('Privacy')).toBeInTheDocument()
        expect(screen.getByText('Terms')).toBeInTheDocument()
        expect(screen.getByText('Cookies')).toBeInTheDocument()
    })

    it('has correct links', () => {
        render(<Footer />)

        const productsLink = screen.getByText('Products').closest('a')
        expect(productsLink).toHaveAttribute('href', '/shop')

        const categoriesLink = screen.getByText('Categories').closest('a')
        expect(categoriesLink).toHaveAttribute('href', '/categories')

        const privacyLink = screen.getByText('Privacy').closest('a')
        expect(privacyLink).toHaveAttribute('href', '/')
    })

    it('renders contact icons', () => {
        render(<Footer />)

        // Check that contact items have icons
        const contactItems = screen.getByText('Contact').parentElement
        const icons = contactItems?.querySelectorAll('svg')
        expect(icons).toHaveLength(3)
    })

    it('has responsive grid layout', () => {
        render(<Footer />)

        const footerGrid = screen.getByText('E-Commerce').closest('[class*="grid"]')
        expect(footerGrid).toHaveClass('md:grid-cols-4')
        expect(footerGrid).toHaveClass('grid-cols-1')
    })
})