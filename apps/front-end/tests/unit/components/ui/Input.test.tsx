import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('Input', () => {
    it('renders correctly with default props', () => {
        render(<Input placeholder="Enter text" />)

        const input = screen.getByPlaceholderText('Enter text')
        expect(input).toBeInTheDocument()
        expect(input).toHaveClass('h-9')
        expect(input).toHaveClass('rounded-md')
    })

    it('handles value changes', () => {
        const handleChange = jest.fn()
        render(<Input onChange={handleChange} placeholder="Test input" />)

        const input = screen.getByPlaceholderText('Test input')
        fireEvent.change(input, { target: { value: 'Hello World' } })

        expect(handleChange).toHaveBeenCalledTimes(1)
        expect(input).toHaveValue('Hello World')
    })

    it('can be disabled', () => {
        render(<Input disabled placeholder="Disabled" />)

        const input = screen.getByPlaceholderText('Disabled')
        expect(input).toBeDisabled()
        expect(input).toHaveClass('disabled:opacity-50')
    })

    it('accepts different types', () => {
        const { rerender } = render(<Input type="email" placeholder="Email" />)
        expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')

        rerender(<Input type="password" placeholder="Password" />)
        expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')

        rerender(<Input type="number" placeholder="Number" />)
        expect(screen.getByPlaceholderText('Number')).toHaveAttribute('type', 'number')
    })

    it('applies custom className', () => {
        render(<Input className="custom-input" placeholder="Custom" />)

        expect(screen.getByPlaceholderText('Custom')).toHaveClass('custom-input')
    })

    it('has focus styles', () => {
        render(<Input placeholder="Focus test" />)

        const input = screen.getByPlaceholderText('Focus test')
        fireEvent.focus(input)

        expect(input).toHaveClass('focus-visible:ring-[3px]')
    })

    it('renders with aria-invalid when invalid', () => {
        render(<Input aria-invalid="true" placeholder="Invalid" />)

        const input = screen.getByPlaceholderText('Invalid')
        expect(input).toHaveAttribute('aria-invalid', 'true')
        expect(input).toHaveClass('aria-invalid:border-destructive')
    })

    it('handles keyboard events', () => {
        const onKeyDown = jest.fn()
        const onKeyUp = jest.fn()

        render(
            <Input
                placeholder="Keyboard test"
                onKeyDown={onKeyDown}
                onKeyUp={onKeyUp}
            />
        )

        const input = screen.getByPlaceholderText('Keyboard test')

        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
        fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' })

        expect(onKeyDown).toHaveBeenCalledTimes(1)
        expect(onKeyUp).toHaveBeenCalledTimes(1)
    })

    it('supports file input type', () => {
        render(<Input type="file" />)

        const input = screen.getByRole('textbox', { hidden: true })
        expect(input).toHaveAttribute('type', 'file')
    })
})