import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import VendorAnalyticsPage from '@/app/vendor/analytics/page'
import { BarChart } from 'recharts'

// Mock recharts to avoid canvas issues
jest.mock('recharts', () => {
    const OriginalModule = jest.requireActual('recharts')
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children, width, height }: any) => (
            <div style={{ width, height }} data-testid="responsive-container">
                {children}
            </div>
        ),
        BarChart: ({ children, data }: any) => (
            <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
                {children}
            </div>
        ),
        Bar: () => <div data-testid="bar" />,
        XAxis: () => <div data-testid="x-axis" />,
        YAxis: () => <div data-testid="y-axis" />,
        CartesianGrid: () => <div data-testid="cartesian-grid" />,
        Tooltip: () => <div data-testid="tooltip" />,
        Legend: () => <div data-testid="legend" />,
    }
})

describe('VendorAnalyticsPage', () => {
    beforeEach(() => {
        // Mock window.matchMedia for dark mode
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

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('renders the analytics page with correct title and description', () => {
        render(<VendorAnalyticsPage />)

        expect(screen.getByText('Analytics')).toBeInTheDocument()
        expect(screen.getByText('Track your sales and performance metrics')).toBeInTheDocument()
    })

    test('renders the sales overview section', () => {
        render(<VendorAnalyticsPage />)

        expect(screen.getByText('Sales Overview')).toBeInTheDocument()
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    test('contains chart with correct data structure', () => {
        render(<VendorAnalyticsPage />)

        const chart = screen.getByTestId('bar-chart')
        expect(chart).toBeInTheDocument()

        // Check if chart components are rendered
        expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
        expect(screen.getByTestId('x-axis')).toBeInTheDocument()
        expect(screen.getByTestId('y-axis')).toBeInTheDocument()
        expect(screen.getByTestId('tooltip')).toBeInTheDocument()
        expect(screen.getByTestId('legend')).toBeInTheDocument()
        expect(screen.getAllByTestId('bar')).toHaveLength(2)
    })

    test('applies glass effect class to chart container', () => {
        render(<VendorAnalyticsPage />)

        const chartContainer = screen.getByText('Sales Overview').closest('.glass')
        expect(chartContainer).toBeInTheDocument()
        expect(chartContainer).toHaveClass('rounded-xl', 'p-8')
    })

    test('has proper responsive container dimensions', () => {
        render(<VendorAnalyticsPage />)

        const responsiveContainer = screen.getByTestId('responsive-container')
        expect(responsiveContainer).toHaveStyle('width: 100%')
        expect(responsiveContainer).toHaveStyle('height: 300px')
    })

    test('renders in dark mode correctly', () => {
        // Mock dark mode
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

        render(<VendorAnalyticsPage />)

        // Check if dark mode classes are present
        const title = screen.getByText('Analytics')
        expect(title).toHaveClass('dark:text-zinc-100')
    })

    test('has accessible color contrast', () => {
        render(<VendorAnalyticsPage />)

        const title = screen.getByText('Analytics')
        expect(title).toHaveClass('text-zinc-900', 'dark:text-zinc-100')

        const description = screen.getByText('Track your sales and performance metrics')
        expect(description).toHaveClass('text-zinc-600', 'dark:text-zinc-400')
    })
})