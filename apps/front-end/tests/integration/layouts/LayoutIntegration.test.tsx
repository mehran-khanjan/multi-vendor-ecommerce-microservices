import React from 'react'
import { render, screen } from '@testing-library/react'
import { AdminLayout } from '@/layout/AdminLayout'
import { Footer } from '@/layout/Footer'
import { Navbar } from '@/layout/Navbar'
import { ThemeProvider } from '@/providers/ThemeProvider'

describe('Layout Integration', () => {
    it('renders complete page layout with all components', () => {
        render(
            <ThemeProvider>
                <div className="min-h-screen">
                    <Navbar />
                    <AdminLayout>
                        <main className="p-6">
                            <h1>Dashboard Content</h1>
                            <p>Welcome to the admin dashboard</p>
                        </main>
                    </AdminLayout>
                    <Footer />
                </div>
            </ThemeProvider>
        )

        // Check Navbar elements
        expect(screen.getByText('E-Commerce')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument()

        // Check AdminLayout elements
        expect(screen.getByText('Admin')).toBeInTheDocument()
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Dashboard Content')).toBeInTheDocument()

        // Check Footer elements
        expect(screen.getByText(/© 2026 E-Commerce\./)).toBeInTheDocument()
    })

    it('maintains theme consistency across components', () => {
        render(
            <ThemeProvider defaultTheme="dark">
                <div className="min-h-screen dark">
                    <Navbar />
                    <AdminLayout>
                        <div>Content</div>
                    </AdminLayout>
                </div>
            </ThemeProvider>
        )

        // Check that dark theme classes are present
        const navbar = screen.getByText('E-Commerce').closest('nav')
        expect(navbar).toHaveClass('dark:bg-black/50')

        const adminSidebar = screen.getByText('Admin').closest('div')
        expect(adminSidebar).toHaveClass('dark:bg-zinc-950')
    })

    it('handles responsive layout correctly', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 768, // Tablet width
        })
        window.dispatchEvent(new Event('resize'))

        render(
            <ThemeProvider>
                <div className="min-h-screen">
                    <Navbar />
                    <AdminLayout>
                        <div>Content</div>
                    </AdminLayout>
                </div>
            </ThemeProvider>
        )

        // On tablet/desktop, sidebar should be visible by default
        const sidebar = screen.getByText('Admin').closest('[class*="w-64"]')
        expect(sidebar).not.toHaveClass('-translate-x-full')
    })

    it('preserves navigation state across layout components', () => {
        render(
            <ThemeProvider>
                <div className="min-h-screen">
                    <Navbar />
                    <AdminLayout>
                        <div>Content</div>
                    </AdminLayout>
                </div>
            </ThemeProvider>
        )

        // Both Navbar and AdminLayout should have consistent navigation
        const navbarShopLink = screen.getByText('Shop').closest('a')
        expect(navbarShopLink).toHaveAttribute('href', '/shop')

        // Admin sidebar should have admin-specific navigation
        expect(screen.getByText('Dashboard')).toHaveAttribute('href', '/dashboard')
        expect(screen.getByText('Settings')).toHaveAttribute('href', '/settings')
    })
})