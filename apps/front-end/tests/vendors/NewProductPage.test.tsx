import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NewProductPage from '@/app/vendor/products/new/page'

// Mock UI components
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, className, variant, type, ...props }: any) => (
        <button className={className} data-variant={variant} type={type} {...props}>
            {children}
        </button>
    ),
}))

jest.mock('@/components/ui/input', () => ({
    Input: ({ className, placeholder, type, ...props }: any) => (
        <input className={className} placeholder={placeholder} type={type} {...props} />
    ),
}))

describe('NewProductPage', () => {
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

    test('renders new product page with correct title', () => {
        render(<NewProductPage />)

        expect(screen.getByText('Add New Product')).toBeInTheDocument()
        expect(screen.getByText('Create a new product listing for your store')).toBeInTheDocument()
    })

    test('renders all form fields', () => {
        render(<NewProductPage />)

        expect(screen.getByLabelText('Product Name')).toBeInTheDocument()
        expect(screen.getByLabelText('Price')).toBeInTheDocument()
        expect(screen.getByLabelText('Original Price')).toBeInTheDocument()
        expect(screen.getByLabelText('Description')).toBeInTheDocument()
        expect(screen.getByLabelText('Category')).toBeInTheDocument()
    })

    test('has correct input types and placeholders', () => {
        render(<NewProductPage />)

        const productNameInput = screen.getByLabelText('Product Name')
        expect(productNameInput).toHaveAttribute('placeholder', 'Enter product name')

        const priceInput = screen.getByLabelText('Price')
        expect(priceInput).toHaveAttribute('type', 'number')
        expect(priceInput).toHaveAttribute('placeholder', '0.00')

        const originalPriceInput = screen.getByLabelText('Original Price')
        expect(originalPriceInput).toHaveAttribute('type', 'number')
        expect(originalPriceInput).toHaveAttribute('placeholder', '0.00')

        const descriptionTextarea = screen.getByLabelText('Description')
        expect(descriptionTextarea).toHaveAttribute('placeholder', 'Describe your product')
    })

    test('renders category select with options', () => {
        render(<NewProductPage />)

        const categorySelect = screen.getByLabelText('Category')
        expect(categorySelect).toBeInTheDocument()

        const options = screen.getAllByRole('option')
        expect(options).toHaveLength(4)
        expect(options[0]).toHaveTextContent('Select a category')
        expect(options[1]).toHaveTextContent('Electronics')
        expect(options[2]).toHaveTextContent('Apparel')
        expect(options[3]).toHaveTextContent('Home & Garden')
    })

    test('renders action buttons', () => {
        render(<NewProductPage />)

        const cancelButton = screen.getByText('Cancel')
        const createButton = screen.getByText('Create Product')

        expect(cancelButton).toBeInTheDocument()
        expect(createButton).toBeInTheDocument()

        expect(cancelButton).toHaveAttribute('data-variant', 'outline')
        expect(createButton).not.toHaveAttribute('data-variant')
    })

    test('has glass effect on form container', () => {
        render(<NewProductPage />)

        const formContainer = screen.getByText('Product Name').closest('.glass')
        expect(formContainer).toBeInTheDocument()
        expect(formContainer).toHaveClass('rounded-xl', 'p-8')
    })

    test('has proper grid layout for price fields', () => {
        render(<NewProductPage />)

        const priceGrid = screen.getByLabelText('Price').closest('.grid')
        expect(priceGrid).toHaveClass('grid-cols-2', 'gap-4')
    })

    test('has correct spacing in form', () => {
        render(<NewProductPage />)

        const form = screen.getByText('Product Name').closest('.space-y-6')
        expect(form).toBeInTheDocument()
    })

    test('handles form input changes', async () => {
        render(<NewProductPage />)

        const productNameInput = screen.getByLabelText('Product Name')
        fireEvent.change(productNameInput, { target: { value: 'New Test Product' } })
        expect(productNameInput).toHaveValue('New Test Product')

        const priceInput = screen.getByLabelText('Price')
        fireEvent.change(priceInput, { target: { value: '99.99' } })
        expect(priceInput).toHaveValue(99.99)

        const descriptionInput = screen.getByLabelText('Description')
        fireEvent.change(descriptionInput, { target: { value: 'A great new product' } })
        expect(descriptionInput).toHaveValue('A great new product')
    })

    test('has proper button layout', () => {
        render(<NewProductPage />)

        const buttonContainer = screen.getByText('Cancel').closest('.flex')
        expect(buttonContainer).toHaveClass('gap-4')

        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
            expect(button).toHaveClass('flex-1', 'rounded-lg')
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

        render(<NewProductPage />)

        const title = screen.getByText('Add New Product')
        expect(title).toHaveClass('dark:text-zinc-100')
    })

    test('has accessible labels and inputs', () => {
        render(<NewProductPage />)

        const labels = screen.getAllByText(/Product Name|Price|Original Price|Description|Category/)
        labels.forEach(label => {
            expect(label).toHaveClass('text-sm', 'font-medium', 'text-zinc-900', 'dark:text-zinc-100')
        })
    })
})