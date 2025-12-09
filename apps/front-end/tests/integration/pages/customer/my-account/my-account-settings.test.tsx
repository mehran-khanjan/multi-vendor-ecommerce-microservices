import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import SettingsPage from '@/app/my-account/settings/page'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    // Icons are mocked in global setup
}))

describe('My Account Settings Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders settings page title', () => {
        render(<SettingsPage />)

        expect(screen.getByText('Account Settings')).toBeInTheDocument()
    })

    test('renders profile picture section', () => {
        render(<SettingsPage />)

        expect(screen.getByText('Profile Picture')).toBeInTheDocument()
        expect(screen.getByText('Upload New Photo')).toBeInTheDocument()
    })

    test('renders personal information form', () => {
        render(<SettingsPage />)

        expect(screen.getByText('Personal Information')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('John')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('+1 (555) 000-0000')).toBeInTheDocument()
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    test('renders password change form', () => {
        render(<SettingsPage />)

        expect(screen.getByText('Change Password')).toBeInTheDocument()
        expect(screen.getAllByPlaceholderText('').filter(input => input.type === 'password')).toHaveLength(3)
        expect(screen.getByText('Update Password')).toBeInTheDocument()
    })

    test('renders preferences section', () => {
        render(<SettingsPage />)

        expect(screen.getByText('Preferences')).toBeInTheDocument()
        expect(screen.getByText('Receive email notifications')).toBeInTheDocument()
        expect(screen.getByText('Receive promotional emails')).toBeInTheDocument()
        expect(screen.getByText('Save Preferences')).toBeInTheDocument()
    })

    test('toggles preference checkboxes', () => {
        render(<SettingsPage />)

        const notificationCheckbox = screen.getByText('Receive email notifications').closest('label').querySelector('input')
        const promotionalCheckbox = screen.getByText('Receive promotional emails').closest('label').querySelector('input')

        expect(notificationCheckbox).toBeChecked()
        expect(promotionalCheckbox).toBeChecked()

        fireEvent.click(notificationCheckbox)
        fireEvent.click(promotionalCheckbox)

        expect(notificationCheckbox).not.toBeChecked()
        expect(promotionalCheckbox).not.toBeChecked()
    })

    test('applies correct grid layout for form fields', () => {
        render(<SettingsPage />)

        const nameGrid = screen.getByPlaceholderText('John').closest('.grid')
        expect(nameGrid).toHaveClass('md:grid-cols-2')
        expect(nameGrid).toHaveClass('grid-cols-1')
    })

    test('applies glass effect styling to sections', () => {
        render(<SettingsPage />)

        const glassElements = screen.getAllByText('Profile Picture').map(el => el.closest('.glass'))
        expect(glassElements.length).toBeGreaterThan(0)
        expect(glassElements.every(el => el !== null)).toBe(true)
    })
})