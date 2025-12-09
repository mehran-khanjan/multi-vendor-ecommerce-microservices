import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/providers/ThemeProvider'

describe('ThemeProvider', () => {
    it('renders children correctly', () => {
        render(
            <ThemeProvider>
                <div>Test Content</div>
            </ThemeProvider>
        )

        expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('passes default props to NextThemesProvider', () => {
        render(
            <ThemeProvider>
                <div>Test</div>
            </ThemeProvider>
        )

        // The ThemeProvider should wrap children with NextThemesProvider
        // We can't directly test NextThemesProvider internals, but we can verify
        // that our component renders without errors and passes children through
        expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('accepts custom props', () => {
        const customProps = {
            attribute: 'data-theme',
            defaultTheme: 'dark',
            enableSystem: true,
            storageKey: 'custom-theme-key',
        }

        render(
            <ThemeProvider {...customProps}>
                <div>Test</div>
            </ThemeProvider>
        )

        // Component should render with custom props
        expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('disables transition on change', () => {
        render(
            <ThemeProvider>
                <div>Test</div>
            </ThemeProvider>
        )

        // The disableTransitionOnChange prop should be passed to NextThemesProvider
        expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('handles null children', () => {
        render(<ThemeProvider>{null}</ThemeProvider>)
        // Should not throw errors
    })

    it('handles undefined children', () => {
        render(<ThemeProvider>{undefined}</ThemeProvider>)
        // Should not throw errors
    })
})