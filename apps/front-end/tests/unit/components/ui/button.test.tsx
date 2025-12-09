import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
    test('renders with default props', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByRole('button')).toHaveTextContent('Click me')
        expect(screen.getByRole('button')).toHaveClass('rounded-lg')
    })

    test('renders with variant outline', () => {
        render(<Button variant="outline">Outline Button</Button>)
        expect(screen.getByRole('button')).toHaveClass('bg-transparent')
    })

    test('renders with size sm', () => {
        render(<Button size="sm">Small Button</Button>)
        expect(screen.getByRole('button')).toHaveClass('text-sm')
    })

    test('renders with icon', () => {
        render(
            <Button>
                <span data-testid="icon">Icon</span>
                Button with Icon
            </Button>
        )
        expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    test('handles click event', () => {
        const handleClick = jest.fn()
        render(<Button onClick={handleClick}>Clickable</Button>)

        fireEvent.click(screen.getByRole('button'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    test('renders as child when asChild prop is provided', () => {
        render(
            <Button asChild>
                <a href="/test">Link Button</a>
            </Button>
        )
        expect(screen.getByRole('link')).toBeInTheDocument()
        expect(screen.getByRole('link')).toHaveTextContent('Link Button')
    })

    test('applies destructive variant styles', () => {
        render(<Button variant="destructive">Delete</Button>)
        expect(screen.getByRole('button')).toHaveClass('bg-red-600')
    })
})