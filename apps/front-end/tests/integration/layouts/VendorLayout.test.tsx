import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { VendorLayout } from '@/layout/VendorLayout'
import { usePathname } from 'next/navigation'

// Mock usePathname
jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}))

describe('VendorLayout', () => {
    const mockUsePathname = usePathname as jest.Mock

    beforeEach(() => {
        mockUsePathname.mockReturnValue('/dashboard')
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders correctly with default props', () => {
        render(
            <VendorLayout>
                <div>Test Content</div>
            </VendorLayout>
        )

        expect(screen.getByText('Vendor')).toBeInTheDocument()
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Products')).toBeInTheDocument()
        expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('highlights active navigation item', () => {
        mockUsePathname.mockReturnValue('/products')

        render(
            <VendorLayout>
                <div>Test Content</div>
            </VendorLayout>
        )

        const productsLink = screen.getByText('Products').closest('a')
        expect(productsLink).toHaveClass('bg-zinc-900', 'dark:bg-zinc-100')
    })

    it('toggles sidebar on mobile', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        })
        window.dispatchEvent(new Event('resize'))

        render(
            <VendorLayout>
                <div>Test Content</div>
            </VendorLayout>
        )

        const toggleButton = screen.getByRole('button', { name: /menu/i })
        fireEvent.click(toggleButton)

        const sidebar = document.querySelector('[class*="w-64"]')
        expect(sidebar).toHaveClass('translate-x-0')
    })

    it('renders all vendor navigation items', () => {
        const vendorNavigation = [
            'Dashboard',
            'Products',
            'Orders',
            'Analytics',
            'Payouts',
            'Reviews',
            'Settings',
        ]

        render(
            <VendorLayout>
                <div>Test Content</div>
            </VendorLayout>
        )

        vendorNavigation.forEach((item) => {
            expect(screen.getByText(item)).toBeInTheDocument()
        })
    })

    it('has correct links for navigation items', () => {
        render(
            <VendorLayout>
                <div>Test Content</div>
            </VendorLayout>
        )

        const dashboardLink = screen.getByText('Dashboard').closest('a')
        expect(dashboardLink).toHaveAttribute('href', '/dashboard')

        const productsLink = screen.getByText('Products').closest('a')
        expect(productsLink).toHaveAttribute('href', '/products')

        const analyticsLink = screen.getByText('Analytics').closest('a')
        expect(analyticsLink).toHaveAttribute('href', '/analytics')
    })

    it('applies correct styles for active and inactive states', () => {
        mockUsePathname.mockReturnValue('/orders')

        render(
            <VendorLayout>
                <div>Test Content</div>
            </VendorLayout>
        )

        const activeLink = screen.getByText('Orders').closest('a')
        const inactiveLink = screen.getByText('Dashboard').closest('a')

        expect(activeLink).toHaveClass('bg-zinc-900', 'dark:bg-zinc-100')
        expect(inactiveLink).toHaveClass('text-zinc-600', 'dark:text-zinc-400')
    })

    it('closes sidebar when clicking backdrop on mobile', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        })

        render(
            <VendorLayout>
                <div>Test Content</div>
            </VendorLayout>
        )

        // Open sidebar
        const toggleButton = screen.getByRole('button', { name: /menu/i })
        fireEvent.click(toggleButton)

        // Click on backdrop
        const backdrop = document.querySelector('[class*="bg-black/50"]')
        if (backdrop) {
            fireEvent.click(backdrop)
        }

        const sidebar = document.querySelector('[class*="w-64"]')
        expect(sidebar).toHaveClass('-translate-x-full')
    })
})