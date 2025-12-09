import { render, screen } from '@/tests/utils/test-utils'
import CustomerLayout from '@/app/layout'

describe('Customer Layout', () => {
    test('renders children without wrapper', () => {
        render(
            <CustomerLayout>
                <div data-testid="test-child">Test Content</div>
            </CustomerLayout>
        )

        expect(screen.getByTestId('test-child')).toBeInTheDocument()
        expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    test('does not add extra DOM elements', () => {
        const { container } = render(
            <CustomerLayout>
                <div>Test</div>
            </CustomerLayout>
        )

        // Should only render the child div
        expect(container.children.length).toBe(1)
        expect(container.firstChild?.nodeName).toBe('DIV')
    })
})