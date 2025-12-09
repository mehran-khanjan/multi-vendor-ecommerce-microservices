import React from 'react'
import { render, screen } from '@testing-library/react'
import VendorPayoutsPage from '@/app/vendor/payouts/page'

// Mock lucide-react
jest.mock('lucide-react', () => ({
    DollarSign: () => <svg data-testid="dollar-sign-icon" />,
    TrendingUp: () => <svg data-testid="trending-up-icon" />,
    Calendar: () => <svg data-testid="calendar-icon" />,
}))

describe('VendorPayoutsPage', () => {
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

    test('renders payouts page with correct title', () => {
        render(<VendorPayoutsPage />)

        expect(screen.getByText('Payouts')).toBeInTheDocument()
        expect(screen.getByText('View and manage your earnings')).toBeInTheDocument()
    })

    test('renders summary cards with correct data', () => {
        render(<VendorPayoutsPage />)

        const summaryCards = [
            { icon: 'dollar-sign-icon', label: 'Total Earnings', value: '$7,461.50' },
            { icon: 'trending-up-icon', label: 'This Month', value: '$2,450.50' },
            { icon: 'calendar-icon', label: 'Next Payout', value: 'Feb 01' },
        ]

        summaryCards.forEach(card => {
            expect(screen.getByText(card.label)).toBeInTheDocument()
            expect(screen.getByText(card.value)).toBeInTheDocument()
            expect(screen.getByTestId(card.icon)).toBeInTheDocument()
        })
    })

    test('renders payout history with correct data', () => {
        render(<VendorPayoutsPage />)

        expect(screen.getByText('Payout History')).toBeInTheDocument()

        const payouts = [
            { id: 'PAY-001', amount: '$2,450.50', status: 'completed', date: '2026-01-15' },
            { id: 'PAY-002', amount: '$1,890.25', status: 'processing', date: '2026-01-08' },
            { id: 'PAY-003', amount: '$3,120.75', status: 'completed', date: '2026-01-01' },
        ]

        payouts.forEach(payout => {
            expect(screen.getByText(payout.id)).toBeInTheDocument()
            expect(screen.getByText(payout.amount)).toBeInTheDocument()
            expect(screen.getByText(payout.status)).toBeInTheDocument()
            expect(screen.getByText(payout.date)).toBeInTheDocument()
        })
    })

    test('applies correct status colors in payout history', () => {
        render(<VendorPayoutsPage />)

        const completedStatus = screen.getAllByText('completed')
        completedStatus.forEach(status => {
            expect(status).toHaveClass('text-green-600')
        })

        const processingStatus = screen.getByText('processing')
        expect(processingStatus).toHaveClass('text-yellow-600')
    })

    test('has glass effect on all containers', () => {
        render(<VendorPayoutsPage />)

        const summaryCards = screen.getAllByText(/Total Earnings|This Month|Next Payout/)
        summaryCards.forEach(card => {
            expect(card.closest('.glass')).toBeInTheDocument()
        })

        const historySection = screen.getByText('Payout History')
        expect(historySection.closest('.glass')).toBeInTheDocument()
    })

    test('has correct grid layout for summary cards', () => {
        render(<VendorPayoutsPage />)

        const summaryGrid = screen.getByText('Total Earnings').closest('.grid')
        expect(summaryGrid).toHaveClass('grid-cols-1', 'md:grid-cols-3')
    })

    test('has proper font weights and sizes', () => {
        render(<VendorPayoutsPage />)

        const payoutAmounts = screen.getAllByText(/\$[\d,]+\.\d{2}/)
        payoutAmounts.forEach(amount => {
            expect(amount).toHaveClass('font-bold')
        })

        const summaryValues = screen.getAllByText(/\$[\d,]+\.\d{2}|Feb 01/)
        summaryValues.forEach(value => {
            expect(value).toHaveClass('text-2xl', 'font-bold')
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

        render(<VendorPayoutsPage />)

        const title = screen.getByText('Payouts')
        expect(title).toHaveClass('dark:text-zinc-100')
    })

    test('has accessible contrast ratios', () => {
        render(<VendorPayoutsPage />)

        const mainTitle = screen.getByText('Payouts')
        expect(mainTitle).toHaveClass('text-zinc-900', 'dark:text-zinc-100')

        const description = screen.getByText('View and manage your earnings')
        expect(description).toHaveClass('text-zinc-600', 'dark:text-zinc-400')
    })
})