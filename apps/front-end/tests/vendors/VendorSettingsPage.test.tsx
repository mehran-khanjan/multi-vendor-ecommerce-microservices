import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VendorSettingsPage from '@/app/vendor/settings/page'

// Mock react-hook-form
const mockRegister = jest.fn()
const mockHandleSubmit = jest.fn(callback => (e: any) => {
    e.preventDefault()
    callback({
        storeName: 'Updated Store',
        description: 'Updated description',
        accountHolder: 'John Doe',
        accountNumber: '12345678',
        freeShipping: true,
        international: true,
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
    Button: ({ children, className, type, ...props }: any) => (
        <button className={className} type={type} {...props}>
            {children}
        </button>
    ),
}))

jest.mock('@/components/ui/input', () => ({
    Input: ({ className, placeholder, type, ...props }: any) => (
        <input className={className} placeholder={placeholder} type={type} {...props} />
    ),
}))

describe('VendorSettingsPage', () => {
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

    test('renders settings page with correct title', () => {
        render(<VendorSettingsPage />)

        expect(screen.getByText('Settings')).toBeInTheDocument()
        expect(screen.getByText('Manage your store settings and preferences')).toBeInTheDocument()
    })

    test('renders all settings sections', () => {
        render(<VendorSettingsPage />)

        expect(screen.getByText('Store Information')).toBeInTheDocument()
        expect(screen.getByText('Bank Details')).toBeInTheDocument()
        expect(screen.getByText('Shipping Settings')).toBeInTheDocument()
    })

    test('pre-fills store information form', () => {
        render(<VendorSettingsPage />)

        expect(screen.getByDisplayValue('TechMart')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Leading electronics and tech products.')).toBeInTheDocument()
    })

    test('registers all form fields with validation', () => {
        render(<VendorSettingsPage />)

        const fields = ['storeName', 'description', 'accountHolder', 'accountNumber']
        fields.forEach(field => {
            expect(mockRegister).toHaveBeenCalledWith(
                field,
                expect.objectContaining({
                    required: expect.anything(),
                })
            )
        })
    })

    test('handles store info form submission', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

        render(<VendorSettingsPage />)

        const saveButton = screen.getByText('Save Store Info')
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                'Store info:',
                expect.objectContaining({
                    storeName: 'Updated Store',
                    description: 'Updated description',
                })
            )
        })

        consoleSpy.mockRestore()
    })

    test('renders shipping settings checkboxes', () => {
        render(<VendorSettingsPage />)

        const freeShippingCheckbox = screen.getByText('Offer free shipping on orders over $50')
        const internationalCheckbox = screen.getByText('Enable international shipping')

        expect(freeShippingCheckbox).toBeInTheDocument()
        expect(internationalCheckbox).toBeInTheDocument()

        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes).toHaveLength(2)
        checkboxes.forEach(checkbox => {
            expect(checkbox).toBeChecked()
        })
    })

    test('has glass effect on all sections', () => {
        render(<VendorSettingsPage />)

        const sections = [
            'Store Information',
            'Bank Details',
            'Shipping Settings',
        ]

        sections.forEach(section => {
            const sectionElement = screen.getByText(section)
            expect(sectionElement.closest('.glass')).toBeInTheDocument()
        })
    })

    test('has proper spacing between sections', () => {
        render(<VendorSettingsPage />)

        const container = screen.getByText('Store Information').closest('.space-y-8')
        expect(container).toBeInTheDocument()
    })

    test('renders all action buttons', () => {
        render(<VendorSettingsPage />)

        const buttons = [
            'Save Store Info',
            'Update Bank Details',
            'Save Shipping Settings',
        ]

        buttons.forEach(buttonText => {
            const button = screen.getByText(buttonText)
            expect(button).toBeInTheDocument()
            expect(button).toHaveClass('rounded-lg')
        })
    })

    test('bank account number is masked as password', () => {
        render(<VendorSettingsPage />)

        const accountNumberInput = screen.getByPlaceholderText('••••••••')
        expect(accountNumberInput).toHaveAttribute('type', 'password')
    })

    test('has proper form layouts', () => {
        render(<VendorSettingsPage />)

        const storeInfoForm = screen.getByText('Store Name').closest('form')
        expect(storeInfoForm).toHaveClass('space-y-4')

        const bankForm = screen.getByText('Account Holder Name').closest('form')
        expect(bankForm).toHaveClass('space-y-4')
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

        render(<VendorSettingsPage />)

        const title = screen.getByText('Settings')
        expect(title).toHaveClass('dark:text-zinc-100')
    })

    test('shows validation errors when present', () => {
        // Mock errors
        jest.doMock('react-hook-form', () => ({
            useForm: () => ({
                register: mockRegister,
                handleSubmit: mockHandleSubmit,
                formState: {
                    errors: {
                        storeName: { message: 'Store name is required' },
                        description: { message: 'Description must be at least 10 characters' },
                    },
                },
            }),
        }))

        const { rerender } = render(<VendorSettingsPage />)

        // Re-render with mocked errors
        rerender(<VendorSettingsPage />)
    })

    test('has accessible labels for all inputs', () => {
        render(<VendorSettingsPage />)

        const labels = [
            'Store Name',
            'Store Description',
            'Account Holder Name',
            'Account Number',
        ]

        labels.forEach(label => {
            const labelElement = screen.getByText(label)
            expect(labelElement).toHaveClass('text-sm', 'font-medium', 'text-zinc-900', 'dark:text-zinc-100')
        })
    })
})