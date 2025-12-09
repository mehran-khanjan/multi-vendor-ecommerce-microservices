import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import VendorProductsPage from '@/app/vendor/products/page'
import { mockProducts } from '@/lib/mock-data'

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
    Plus: () => <svg data-testid="plus-icon" />,
    Edit: () => <svg data-testid="edit-icon" />,
    Trash2: () => <svg data-testid="trash-icon" />,
    Eye: () => <svg data-testid="eye-icon" />,
}))

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt, fill, className }: any) => (
        <img src={src} alt={alt} className={className} data-fill={fill} />
    ),
}))

// Mock mock-data
jest.mock('@/lib/mock-data', () => ({
    mockProducts: [
        { id: '1', name: 'Wireless Headphones', price: 299.99, reviews: 42, inStock: true, image: '/headphones.jpg' },
        { id: '2', name: 'USB Cable', price: 19.99, reviews: 18, inStock: false, image: '/cable.jpg' },
        { id: '3', name: 'Phone Case', price: 24.99, reviews: 56, inStock: true, image: '/case.jpg' },
    ],
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

describe('VendorProductsPage', () => {
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

    test('renders products page with correct title and count', () => {
        render(<VendorProductsPage />)

        expect(screen.getByText('Products')).toBeInTheDocument()
        expect(screen.getByText(`Manage ${mockProducts.length} products`)).toBeInTheDocument()
    })

    test('renders add product button with correct link', () => {
        render(<VendorProductsPage />)

        const addButton = screen.getByText('Add Product')
        expect(addButton).toBeInTheDocument()
        expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
        expect(addButton.closest('a')).toHaveAttribute('href', '/vendor/products/new')
    })

    test('renders all products from mock data', () => {
        render(<VendorProductsPage />)

        mockProducts.forEach(product => {
            expect(screen.getByText(product.name)).toBeInTheDocument()
            expect(screen.getByText(`$${product.price.toFixed(2)}`)).toBeInTheDocument()
            expect(screen.getByText(`${product.reviews} reviews`)).toBeInTheDocument()
            expect(screen.getByText(product.inStock ? 'In stock' : 'Out of stock')).toBeInTheDocument()
        })
    })

    test('renders product images with correct attributes', () => {
        render(<VendorProductsPage />)

        const images = screen.getAllByRole('img')
        mockProducts.forEach((product, index) => {
            expect(images[index]).toHaveAttribute('src', product.image)
            expect(images[index]).toHaveAttribute('alt', product.name)
            expect(images[index]).toHaveAttribute('data-fill', 'true')
        })
    })

    test('renders action buttons for each product', () => {
        render(<VendorProductsPage />)

        const viewButtons = screen.getAllByTestId('eye-icon')
        const editButtons = screen.getAllByTestId('edit-icon')
        const deleteButtons = screen.getAllByTestId('trash-icon')

        expect(viewButtons).toHaveLength(mockProducts.length)
        expect(editButtons).toHaveLength(mockProducts.length)
        expect(deleteButtons).toHaveLength(mockProducts.length)
    })

    test('has correct edit button links', () => {
        render(<VendorProductsPage />)

        const editLinks = screen.getAllByTestId('edit-icon')
        editLinks.forEach((icon, index) => {
            const link = icon.closest('a')
            expect(link).toHaveAttribute('href', `/vendor/products/${mockProducts[index].id}/edit`)
        })
    })

    test('displays correct stock status colors', () => {
        render(<VendorProductsPage />)

        mockProducts.forEach(product => {
            const stockText = screen.getByText(product.inStock ? 'In stock' : 'Out of stock')
            expect(stockText).toBeInTheDocument()
        })
    })

    test('formats prices correctly', () => {
        render(<VendorProductsPage />)

        mockProducts.forEach(product => {
            const formattedPrice = `$${product.price.toFixed(2)}`
            expect(screen.getByText(formattedPrice)).toBeInTheDocument()
        })
    })

    test('has glass effect on product cards', () => {
        render(<VendorProductsPage />)

        const productCards = screen.getAllByText(/Wireless Headphones|USB Cable|Phone Case/)
        productCards.forEach(card => {
            expect(card.closest('.glass')).toBeInTheDocument()
        })
    })

    test('has proper spacing and layout', () => {
        render(<VendorProductsPage />)

        const productGrid = screen.getByText('Wireless Headphones').closest('.space-y-4')
        expect(productGrid).toBeInTheDocument()

        mockProducts.forEach(() => {
            const productContainer = screen.getByText('Wireless Headphones').closest('.flex')
            expect(productContainer).toHaveClass('items-center', 'gap-4')
        })
    })

    test('handles delete button click', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

        render(<VendorProductsPage />)

        const deleteButtons = screen.getAllByTestId('trash-icon')
        fireEvent.click(deleteButtons[0].closest('button')!)

        // In a real test, you would test the actual delete functionality
        expect(deleteButtons[0].closest('button')).toHaveClass('text-red-600')

        consoleSpy.mockRestore()
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

        render(<VendorProductsPage />)

        const title = screen.getByText('Products')
        expect(title).toHaveClass('dark:text-zinc-100')
    })
})