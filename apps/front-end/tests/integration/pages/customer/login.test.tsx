import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import LoginPage from '@/app/log-in/page'

describe('Login Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders login form with title', () => {
        render(<LoginPage />)

        expect(screen.getByText('Welcome Back')).toBeInTheDocument()
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    })

    test('renders all form fields', () => {
        render(<LoginPage />)

        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
        expect(screen.getByText('Remember me')).toBeInTheDocument()
        expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    test('renders sign up link', () => {
        render(<LoginPage />)

        expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
        expect(screen.getByText('Sign up')).toHaveAttribute('href', '/sign-up')
    })

    test('validates required email field', async () => {
        render(<LoginPage />)

        const submitButton = screen.getByText('Sign In')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Email is required')).toBeInTheDocument()
        })
    })

    test('validates email format', async () => {
        render(<LoginPage />)

        const emailInput = screen.getByPlaceholderText('you@example.com')
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
        fireEvent.blur(emailInput)

        const submitButton = screen.getByText('Sign In')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Invalid email address')).toBeInTheDocument()
        })
    })

    test('validates password requirements', async () => {
        render(<LoginPage />)

        const passwordInput = screen.getByPlaceholderText('••••••••')
        fireEvent.change(passwordInput, { target: { value: 'short' } })
        fireEvent.blur(passwordInput)

        const submitButton = screen.getByText('Sign In')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
        })
    })

    test('toggles remember me checkbox', () => {
        render(<LoginPage />)

        const rememberCheckbox = screen.getByText('Remember me').previousSibling
        expect(rememberCheckbox).not.toBeChecked()

        fireEvent.click(rememberCheckbox)
        expect(rememberCheckbox).toBeChecked()
    })

    test('applies glass effect styling', () => {
        render(<LoginPage />)

        const glassContainer = screen.getByText('Welcome Back').closest('.glass')
        expect(glassContainer).toBeInTheDocument()
        expect(glassContainer).toHaveClass('rounded-2xl')
    })
})