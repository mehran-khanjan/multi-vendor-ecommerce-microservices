import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import SignUpPage from '@/app/sign-up/page'

describe('SignUp Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders sign up form with title', () => {
        render(<SignUpPage />)

        expect(screen.getByText('Get Started')).toBeInTheDocument()
        expect(screen.getByText('Create your account')).toBeInTheDocument()
    })

    test('renders all form fields', () => {
        render(<SignUpPage />)

        expect(screen.getByPlaceholderText('John')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
        expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2)
        expect(screen.getByText('Create Account')).toBeInTheDocument()
    })

    test('renders terms and privacy links', () => {
        render(<SignUpPage />)

        expect(screen.getByText('Terms')).toBeInTheDocument()
        expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    })

    test('renders login link', () => {
        render(<SignUpPage />)

        expect(screen.getByText('Already have an account?')).toBeInTheDocument()
        expect(screen.getByText('Sign in')).toHaveAttribute('href', '/log-in')
    })

    test('validates required fields', async () => {
        render(<SignUpPage />)

        const submitButton = screen.getByText('Create Account')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('First name is required')).toBeInTheDocument()
            expect(screen.getByText('Last name is required')).toBeInTheDocument()
            expect(screen.getByText('Email is required')).toBeInTheDocument()
            expect(screen.getByText('Password is required')).toBeInTheDocument()
            expect(screen.getByText('Please confirm your password')).toBeInTheDocument()
            expect(screen.getByText('You must agree to the terms')).toBeInTheDocument()
        })
    })

    test('validates password confirmation', async () => {
        render(<SignUpPage />)

        const passwordInput = screen.getAllByPlaceholderText('••••••••')[0]
        const confirmInput = screen.getAllByPlaceholderText('••••••••')[1]

        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.change(confirmInput, { target: { value: 'different123' } })
        fireEvent.blur(confirmInput)

        const submitButton = screen.getByText('Create Account')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
        })
    })

    test('validates name length requirements', async () => {
        render(<SignUpPage />)

        const firstNameInput = screen.getByPlaceholderText('John')
        fireEvent.change(firstNameInput, { target: { value: 'A' } })
        fireEvent.blur(firstNameInput)

        const submitButton = screen.getByText('Create Account')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument()
        })
    })

    test('toggles terms agreement', () => {
        render(<SignUpPage />)

        const termsCheckbox = screen.getByText('Terms').closest('label').querySelector('input')
        expect(termsCheckbox).not.toBeChecked()

        fireEvent.click(termsCheckbox)
        expect(termsCheckbox).toBeChecked()
    })

    test('applies correct grid layout for name fields', () => {
        render(<SignUpPage />)

        const nameContainer = screen.getByPlaceholderText('John').closest('.grid')
        expect(nameContainer).toHaveClass('grid-cols-2')
    })
})