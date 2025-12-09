import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminLayout } from '@/layout/AdminLayout'
import { usePathname } from 'next/navigation'

// Mock usePathname
jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}))

describe('AdminLayout', () => {
    const mockUsePathname = usePathname as jest.Mock

    beforeEach(() => {
        mockUsePathname.mockReturnValue('/dashboard')
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders correctly with default props', () => {
        render(
            <AdminLayout>
                <div>Test Content</div>
            </AdminLayout>
        )

        expect(screen.getByText('Admin')).toBeInTheDocument()
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Users')).toBeInTheDocument()
        expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('highlights active navigation item', () => {
        mockUsePathname.mockReturnValue('/users')

        render(
            <AdminLayout>
                <div>Test Content</div>
            </AdminLayout>
        )

        const usersLink = screen.getByText('Users').closest('a')
        expect(usersLink).toHaveClass('bg-red-600')
        expect(usersLink).toHaveClass('text-white')
    })

    it('toggles sidebar on mobile', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        })
        window.dispatchEvent(new Event('resize'))

        render(
            <AdminLayout>
                <div>Test Content</div>
            </AdminLayout>
        )

        const toggleButton = screen.getByRole('button', { name: /menu/i })
        fireEvent.click(toggleButton)

        const sidebar = document.querySelector('[class*="w-64"]')
        expect(sidebar).toHaveClass('translate-x-0')
    })

    it('closes sidebar when clicking on navigation link on mobile', async () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        })

        render(
            <AdminLayout>
                <div>Test Content</div>
            </AdminLayout>
        )

        // Open sidebar
        const toggleButton = screen.getByRole('button', { name: /menu/i })
        fireEvent.click(toggleButton)

        // Click on navigation link
        const dashboardLink = screen.getByText('Dashboard')
        fireEvent.click(dashboardLink)

        await waitFor(() => {
            const sidebar = document.querySelector('[class*="w-64"]')
            expect(sidebar).toHaveClass('-translate-x-full')
        })
    })

    it('closes sidebar when clicking on backdrop on mobile', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        })

        render(
            <AdminLayout>
                <div>Test Content</div>
            </AdminLayout>
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

    it('renders all navigation items', () => {
        const navigationItems = [
            'Dashboard',
            'Users',
            'Vendors',
            'Products',
            'Orders',
            'Categories',
            'Payments',
            'Settings',
        ]

        render(
            <AdminLayout>
                <div>Test Content</div>
            </AdminLayout>
        )

        navigationItems.forEach((item) => {
            expect(screen.getByText(item)).toBeInTheDocument()
        })
    })

    it('has correct links for navigation items', () => {
        render(
            <AdminLayout>
                <div>Test Content</div>
            </AdminLayout>
        )

        const dashboardLink = screen.getByText('Dashboard').closest('a')
        expect(dashboardLink).toHaveAttribute('href', '/dashboard')

        const usersLink = screen.getByText('Users').closest('a')
        expect(usersLink).toHaveAttribute('href', '/users')
    })
})