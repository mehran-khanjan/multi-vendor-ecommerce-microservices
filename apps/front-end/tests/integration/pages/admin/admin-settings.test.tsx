import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import AdminSettingsPage from '@/app/admin/settings/page'
import { useForm } from 'react-hook-form'

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
    ...jest.requireActual('react-hook-form'),
    useForm: jest.fn(),
}))

describe('AdminSettingsPage', () => {
    const mockUseForm = useForm as jest.Mock
    const mockHandleSubmit = jest.fn()
    const mockRegister = jest.fn()
    const mockFormState = { errors: {} }

    beforeEach(() => {
        jest.clearAllMocks()

        mockUseForm.mockReturnValue({
            register: mockRegister.mockImplementation((name, options) => ({
                name,
                onChange: jest.fn(),
                onBlur: jest.fn(),
                ref: jest.fn(),
            })),
            handleSubmit: mockHandleSubmit.mockImplementation((callback) => (e: any) => {
                e.preventDefault()
                callback({
                    platformName: 'E-Commerce',
                    supportEmail: 'support@ecommerce.local',
                    standardCommission: 5,
                    premiumCommission: 3,
                    require2FA: true,
                    paymentVerification: true,
                })
            }),
            formState: mockFormState,
        })
    })

    test('renders settings page title', () => {
        render(<AdminSettingsPage />)

        expect(screen.getByText('Settings')).toBeInTheDocument()
        expect(screen.getByText('Manage platform settings and configuration')).toBeInTheDocument()
    })

    test('renders platform settings form', () => {
        render(<AdminSettingsPage />)

        expect(screen.getByText('Platform Settings')).toBeInTheDocument()
        expect(screen.getByLabelText('Platform Name')).toBeInTheDocument()
        expect(screen.getByLabelText('Support Email')).toBeInTheDocument()
        expect(screen.getByText('Save Settings')).toBeInTheDocument()
    })

    test('renders commission settings form', () => {
        render(<AdminSettingsPage />)

        expect(screen.getByText('Commission Settings')).toBeInTheDocument()
        expect(screen.getByLabelText('Standard Commission %')).toBeInTheDocument()
        expect(screen.getByLabelText('Premium Commission %')).toBeInTheDocument()
        expect(screen.getByText('Save Commission')).toBeInTheDocument()
    })

    test('renders security settings', () => {
        render(<AdminSettingsPage />)

        expect(screen.getByText('Security')).toBeInTheDocument()
        expect(screen.getByText('Require 2FA for admin accounts')).toBeInTheDocument()
        expect(screen.getByText('Enable payment verification')).toBeInTheDocument()
        expect(screen.getByText('Save Security Settings')).toBeInTheDocument()
    })

    test('submits platform settings form', async () => {
        render(<AdminSettingsPage />)

        const saveButton = screen.getByText('Save Settings')
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(mockHandleSubmit).toHaveBeenCalled()
        })
    })

    test('shows validation error for invalid email', () => {
        const mockErrors = {
            supportEmail: {
                type: 'pattern',
                message: 'Invalid email address',
            },
        }

        mockUseForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: mockHandleSubmit,
            formState: { errors: mockErrors },
        })

        render(<AdminSettingsPage />)

        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    })

    test('updates form fields', () => {
        render(<AdminSettingsPage />)

        const platformNameInput = screen.getByLabelText('Platform Name')
        const emailInput = screen.getByLabelText('Support Email')

        fireEvent.change(platformNameInput, { target: { value: 'New Platform Name' } })
        fireEvent.change(emailInput, { target: { value: 'new-support@example.com' } })

        expect(platformNameInput).toHaveValue('New Platform Name')
        expect(emailInput).toHaveValue('new-support@example.com')
    })

    test('toggles security checkboxes', () => {
        render(<AdminSettingsPage />)

        const twoFACheckbox = screen.getByLabelText('Require 2FA for admin accounts')
        const paymentCheckbox = screen.getByLabelText('Enable payment verification')

        expect(twoFACheckbox).toBeChecked()
        expect(paymentCheckbox).toBeChecked()

        fireEvent.click(twoFACheckbox)
        fireEvent.click(paymentCheckbox)

        expect(twoFACheckbox).not.toBeChecked()
        expect(paymentCheckbox).not.toBeChecked()
    })
})