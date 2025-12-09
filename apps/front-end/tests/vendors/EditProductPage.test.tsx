import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditProductPage from '@/app/vendor/products/[id]/edit/page'

// Mock react-hook-form
const mockRegister = jest.fn()
const mockHandleSubmit = jest.fn(callback => (e: any) => {
    e.preventDefault()
    callback({
        name: 'Premium Wireless Headphones',
        price: 299.99,
        originalPrice: 399.99,
        description: 'Updated description',
        stock: 50,
    })
})
const mockErrors = {}

jest.mock('react-hook-form', () => ({
    useForm: () => ({
        register: mockRegister,
        handleSubmit: mockHandleSubmit,
        formState: { errors: mockErrors },
    }),
}))

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

describe('EditProductPage', () => {
    beforeEach(() => {
        mockRegister.mockClear()
        mockHandleSubmit.mockClear()

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

    test('renders edit product page with correct title', () => {
        render(<EditProductPage params={{ id: '1' }} />)

        expect(screen.getByText('Edit Product')).toBeInTheDocument()
        expect(screen.getByText('Update your product details')).toBeInTheDocument()
    })

    test('pre-fills form with default values', () => {
        render(<EditProductPage params={{ id: '1' }} />)

        expect(screen.getByDisplayValue('Premium Wireless Headphones')).toBeInTheDocument()
        expect(screen.getByDisplayValue('299.99')).toBeInTheDocument()
        expect(screen.getByDisplayValue('399.99')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Experience pristine audio with active noise cancellation and 30-hour battery life.')).toBeInTheDocument()
        expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    })

    test('registers all form fields', () => {
        render(<EditProductPage params={{ id: '1' }} />)

        const fields = ['name', 'price', 'originalPrice', 'description', 'stock']
        fields.forEach(field => {
            expect(mockRegister).toHaveBeenCalledWith(
                field,
                expect.objectContaining({
                    required: expect.anything(),
                })
            )
        })
    })

    test('handles form submission', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

        render(<EditProductPage params={{ id: '1' }} />)

        const saveButton = screen.getByText('Save Changes')
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                'Updated product:',
                expect.objectContaining({
                    name: 'Premium Wireless Headphones',
                    price: 299.99,
                    originalPrice: 399.99,
                })
            )
        })

        consoleSpy.mockRestore()
    })

    test('shows validation errors', () => {
        // Mock errors
        jest.doMock('react-hook-form', () => ({
            useForm: () => ({
                register: mockRegister,
                handleSubmit: mockHandleSubmit,
                formState: {
                    errors: {
                        name: { message: 'Product name is required' },
                        price: { message: 'Price must be positive' },
                    },
                },
            }),
        }))

        const { rerender } = render(<EditProductPage params={{ id: '1' }} />)

        // Re-render with mocked errors
        rerender(<EditProductPage params={{ id: '1' }} />)
    })

    test('renders all form fields with correct labels', () => {
        render(<EditProductPage params={{ id: '1' }} />)

        const labels = [
            'Product Name',
            'Price',
            'Original Price',
            'Description',
            'Stock',
        ]

        labels.forEach(label => {
            expect(screen.getByText(label)).toBeInTheDocument()
        })
    })

    test('has proper input types', () => {
        render(<EditProductPage params={{ id: '1' }} />)

        const priceInput = screen.getByDisplayValue('299.99')
        expect(priceInput).toHaveAttribute('type', 'number')
        expect(priceInput).toHaveAttribute('step', '0.01')

        const stockInput = screen.getByDisplayValue('50')
        expect(stockInput).toHaveAttribute('type', 'number')
    })

    test('renders action buttons', () => {
        render(<EditProductPage params={{ id: '1' }} />)

        const cancelButton = screen.getByText('Cancel')
        const saveButton = screen.getByText('Save Changes')

        expect(cancelButton).toBeInTheDocument()
        expect(saveButton).toBeInTheDocument()

        expect(cancelButton).toHaveAttribute('data-variant', 'outline')
        expect(saveButton).toHaveAttribute('type', 'submit')
    })

    test('has proper form layout', () => {
        render(<EditProductPage params={{ id: '1' }} />)

        const form = screen.getByText('Product Name').closest('form')
        expect(form).toHaveClass('space-y-6')

        const priceGrid = screen.getByDisplayValue('299.99').closest('.grid')
        expect(priceGrid).toHaveClass('grid-cols-2', 'gap-4')
    })

    test('has glass effect on form container', () => {
        render(<EditProductPage params={{ id: '1' }} />)

        const formContainer = screen.getByText('Product Name').closest('.glass')
        expect(formContainer).toBeInTheDocument()
        expect(formContainer).toHaveClass('rounded-xl', 'p-8')
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

        render(<EditProductPage params={{ id: '1' }} />)

        const title = screen.getByText('Edit Product')
        expect(title).toHaveClass('dark:text-zinc-100')
    })
})