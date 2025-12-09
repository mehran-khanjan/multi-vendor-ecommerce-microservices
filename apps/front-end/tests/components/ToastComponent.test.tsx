import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { toast, useToast } from './toast'

// Mock Toast component for testing
const MockToastComponent = () => {
    const { toast: toastFunc, dismiss, toasts } = useToast()

    return (
        <div>
            <button
                data-testid="show-toast"
                onClick={() => toastFunc({ title: 'Test Toast', description: 'Test Description' })}
            >
                Show Toast
            </button>

            <button
                data-testid="dismiss-all"
                onClick={() => dismiss()}
            >
                Dismiss All
            </button>

            <div data-testid="toast-count">
                {toasts.length} toasts
            </div>

            {toasts.map((t) => (
                <div key={t.id} data-testid={`toast-${t.id}`}>
                    <span data-testid={`toast-title-${t.id}`}>{t.title}</span>
                    <span data-testid={`toast-desc-${t.id}`}>{t.description}</span>
                    <button
                        data-testid={`dismiss-${t.id}`}
                        onClick={() => dismiss(t.id)}
                    >
                        Dismiss
                    </button>
                </div>
            ))}
        </div>
    )
}

describe('Toast Component Integration', () => {
    beforeEach(() => {
        // Clear any existing toasts
        const { result } = renderHook(() => useToast())
        act(() => {
            result.current.dismiss()
        })
    })

    it('should show toast when button is clicked', () => {
        render(<MockToastComponent />)

        fireEvent.click(screen.getByTestId('show-toast'))

        expect(screen.getByTestId('toast-count')).toHaveTextContent('1 toasts')
        expect(screen.getByTestId(/toast-title-/)).toHaveTextContent('Test Toast')
        expect(screen.getByTestId(/toast-desc-/)).toHaveTextContent('Test Description')
    })

    it('should dismiss specific toast', () => {
        render(<MockToastComponent />)

        // Show toast
        fireEvent.click(screen.getByTestId('show-toast'))

        const toastTitle = screen.getByTestId(/toast-title-/)
        const toastId = toastTitle.dataset.testid?.replace('toast-title-', '')

        // Dismiss the toast
        fireEvent.click(screen.getByTestId(`dismiss-${toastId}`))

        expect(screen.getByTestId('toast-count')).toHaveTextContent('1 toasts')
        // Toast should still exist but be closed
    })

    it('should dismiss all toasts', () => {
        render(<MockToastComponent />)

        // Show multiple toasts (though limited to 1 by TOAST_LIMIT)
        fireEvent.click(screen.getByTestId('show-toast'))

        // Dismiss all
        fireEvent.click(screen.getByTestId('dismiss-all'))

        expect(screen.getByTestId('toast-count')).toHaveTextContent('1 toasts')
        // All toasts should be closed
    })

    it('should limit toasts based on TOAST_LIMIT', () => {
        const { result } = renderHook(() => useToast())

        // Add more toasts than the limit
        act(() => {
            result.current.toast({ title: 'Toast 1' })
            result.current.toast({ title: 'Toast 2' })
            result.current.toast({ title: 'Toast 3' })
            result.current.toast({ title: 'Toast 4' })
            result.current.toast({ title: 'Toast 5' })
        })

        expect(result.current.toasts).toHaveLength(1) // Limited by TOAST_LIMIT
        expect(result.current.toasts[0].title).toBe('Toast 5') // Most recent kept
    })

    it('should update toast content', async () => {
        const { result } = renderHook(() => useToast())

        let toastId: string

        act(() => {
            const toastInstance = result.current.toast({
                title: 'Original Title',
                description: 'Original Description'
            })
            toastId = toastInstance.id
        })

        // Update the toast
        act(() => {
            const toastToUpdate = result.current.toasts.find(t => t.id === toastId)
            if (toastToUpdate) {
                result.current.toast.update({
                    ...toastToUpdate,
                    title: 'Updated Title',
                    description: 'Updated Description',
                })
            }
        })

        await waitFor(() => {
            const updatedToast = result.current.toasts.find(t => t.id === toastId)
            expect(updatedToast?.title).toBe('Updated Title')
            expect(updatedToast?.description).toBe('Updated Description')
        })
    })

    it('should handle toast auto-dismissal', async () => {
        jest.useFakeTimers()

        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.toast({ title: 'Auto-dismissing Toast' })
        })

        const initialCount = result.current.toasts.length

        // Fast-forward past the removal delay
        act(() => {
            jest.advanceTimersByTime(TOAST_REMOVE_DELAY + 1000)
        })

        await waitFor(() => {
            expect(result.current.toasts.length).toBeLessThan(initialCount)
        })

        jest.useRealTimers()
    })

    it('should maintain toast state across component re-renders', () => {
        const { result, rerender } = renderHook(() => useToast())

        act(() => {
            result.current.toast({ title: 'Persistent Toast' })
        })

        const initialToast = result.current.toasts[0]

        // Re-render the hook
        rerender()

        expect(result.current.toasts[0]).toEqual(initialToast)
    })
})