import { renderHook, act } from '@testing-library/react'
import { useToast, toast, reducer } from './toast'

describe('Toast System', () => {
    beforeEach(() => {
        // Reset the toast state before each test
        const { result } = renderHook(() => useToast())
        act(() => {
            result.current.dismiss()
        })
    })

    describe('Reducer', () => {
        const mockToast = {
            id: '1',
            title: 'Test Toast',
            description: 'Test Description',
            open: true,
        }

        const mockState = {
            toasts: [mockToast],
        }

        it('should handle ADD_TOAST action', () => {
            const newToast = {
                id: '2',
                title: 'New Toast',
                description: 'New Description',
                open: true,
            }

            const action = {
                type: 'ADD_TOAST' as const,
                toast: newToast,
            }

            const result = reducer(mockState, action)

            expect(result.toasts).toHaveLength(2)
            expect(result.toasts[0]).toEqual(newToast)
            expect(result.toasts[1]).toEqual(mockToast)
        })

        it('should respect TOAST_LIMIT when adding toasts', () => {
            const initialState = {
                toasts: Array.from({ length: 5 }, (_, i) => ({
                    id: `${i}`,
                    title: `Toast ${i}`,
                    open: true,
                })),
            }

            const newToast = {
                id: '6',
                title: 'New Toast',
                open: true,
            }

            const action = {
                type: 'ADD_TOAST' as const,
                toast: newToast,
            }

            const result = reducer(initialState, action)

            expect(result.toasts).toHaveLength(1) // Should be limited to TOAST_LIMIT (1)
            expect(result.toasts[0]).toEqual(newToast)
        })

        it('should handle UPDATE_TOAST action', () => {
            const updatedToast = {
                id: '1',
                title: 'Updated Toast',
                description: 'Updated Description',
                open: true,
            }

            const action = {
                type: 'UPDATE_TOAST' as const,
                toast: updatedToast,
            }

            const result = reducer(mockState, action)

            expect(result.toasts).toHaveLength(1)
            expect(result.toasts[0]).toEqual(updatedToast)
        })

        it('should handle UPDATE_TOAST for non-existent toast', () => {
            const updatedToast = {
                id: 'non-existent',
                title: 'Updated Toast',
                open: true,
            }

            const action = {
                type: 'UPDATE_TOAST' as const,
                toast: updatedToast,
            }

            const result = reducer(mockState, action)

            expect(result.toasts).toHaveLength(1)
            expect(result.toasts[0]).toEqual(mockToast) // Should remain unchanged
        })

        it('should handle DISMISS_TOAST with specific toastId', () => {
            const action = {
                type: 'DISMISS_TOAST' as const,
                toastId: '1',
            }

            const result = reducer(mockState, action)

            expect(result.toasts).toHaveLength(1)
            expect(result.toasts[0].open).toBe(false)
        })

        it('should handle DISMISS_TOAST without toastId', () => {
            const action = {
                type: 'DISMISS_TOAST' as const,
            }

            const result = reducer(mockState, action)

            expect(result.toasts).toHaveLength(1)
            expect(result.toasts[0].open).toBe(false)
        })

        it('should handle REMOVE_TOAST with specific toastId', () => {
            const action = {
                type: 'REMOVE_TOAST' as const,
                toastId: '1',
            }

            const result = reducer(mockState, action)

            expect(result.toasts).toHaveLength(0)
        })

        it('should handle REMOVE_TOAST without toastId', () => {
            const action = {
                type: 'REMOVE_TOAST' as const,
            }

            const result = reducer(mockState, action)

            expect(result.toasts).toHaveLength(0)
        })

        it('should return current state for unknown action', () => {
            const unknownAction = {
                type: 'UNKNOWN_ACTION' as any,
            }

            const result = reducer(mockState, unknownAction)

            expect(result).toEqual(mockState)
        })
    })

    describe('toast function', () => {
        it('should create a toast with correct structure', () => {
            const toastConfig = {
                title: 'Test Toast',
                description: 'Test Description',
                variant: 'default' as const,
            }

            const result = toast(toastConfig)

            expect(result).toHaveProperty('id')
            expect(result).toHaveProperty('dismiss')
            expect(result).toHaveProperty('update')
            expect(typeof result.dismiss).toBe('function')
            expect(typeof result.update).toBe('function')
        })

        it('should generate unique IDs', () => {
            const toast1 = toast({ title: 'First' })
            const toast2 = toast({ title: 'Second' })

            expect(toast1.id).not.toBe(toast2.id)
        })

        it('should allow updating a toast', () => {
            const toastInstance = toast({ title: 'Original' })

            act(() => {
                toastInstance.update({
                    id: toastInstance.id,
                    title: 'Updated',
                    description: 'New Description',
                })
            })

            const { result } = renderHook(() => useToast())
            const updatedToast = result.current.toasts.find(t => t.id === toastInstance.id)

            expect(updatedToast?.title).toBe('Updated')
            expect(updatedToast?.description).toBe('New Description')
        })

        it('should allow dismissing a toast', () => {
            const toastInstance = toast({ title: 'To Dismiss' })

            act(() => {
                toastInstance.dismiss()
            })

            const { result } = renderHook(() => useToast())
            const dismissedToast = result.current.toasts.find(t => t.id === toastInstance.id)

            expect(dismissedToast?.open).toBe(false)
        })
    })

    describe('useToast hook', () => {
        it('should provide toast state and functions', () => {
            const { result } = renderHook(() => useToast())

            expect(result.current).toHaveProperty('toasts')
            expect(result.current).toHaveProperty('toast')
            expect(result.current).toHaveProperty('dismiss')
            expect(Array.isArray(result.current.toasts)).toBe(true)
            expect(typeof result.current.toast).toBe('function')
            expect(typeof result.current.dismiss).toBe('function')
        })

        it('should add toast via hook', () => {
            const { result } = renderHook(() => useToast())

            act(() => {
                result.current.toast({
                    title: 'Hook Toast',
                    description: 'From hook',
                })
            })

            expect(result.current.toasts).toHaveLength(1)
            expect(result.current.toasts[0].title).toBe('Hook Toast')
        })

        it('should dismiss toast via hook', () => {
            const { result } = renderHook(() => useToast())

            act(() => {
                result.current.toast({
                    title: 'To Dismiss',
                    description: 'Will be dismissed',
                })
            })

            const toastId = result.current.toasts[0].id

            act(() => {
                result.current.dismiss(toastId)
            })

            expect(result.current.toasts[0].open).toBe(false)
        })

        it('should dismiss all toasts via hook', () => {
            const { result } = renderHook(() => useToast())

            act(() => {
                result.current.toast({ title: 'Toast 1' })
                result.current.toast({ title: 'Toast 2' })
                result.current.toast({ title: 'Toast 3' })
            })

            expect(result.current.toasts).toHaveLength(1) // Limited by TOAST_LIMIT

            act(() => {
                result.current.dismiss()
            })

            expect(result.current.toasts[0].open).toBe(false)
        })

        it('should clean up listeners on unmount', () => {
            const { result, unmount } = renderHook(() => useToast())

            const initialListenerCount = result.current.toasts.length

            unmount()

            // Create new hook instance to check if listeners were cleaned up
            const { result: result2 } = renderHook(() => useToast())

            // The new instance should have its own state
            expect(result2.current.toasts).toHaveLength(0)
        })
    })

    describe('Toast lifecycle', () => {
        it('should auto-remove toast after delay', () => {
            jest.useFakeTimers()

            const { result } = renderHook(() => useToast())

            act(() => {
                result.current.toast({ title: 'Auto-remove' })
            })

            const toastId = result.current.toasts[0].id

            // Fast-forward past the removal delay
            act(() => {
                jest.advanceTimersByTime(TOAST_REMOVE_DELAY + 1000)
            })

            // Toast should have been removed
            expect(result.current.toasts.find(t => t.id === toastId)).toBeUndefined()

            jest.useRealTimers()
        })

        it('should not create duplicate timeout for same toast', () => {
            jest.useFakeTimers()

            const mockSetTimeout = jest.spyOn(global, 'setTimeout')

            const { result } = renderHook(() => useToast())

            act(() => {
                // Dismiss same toast multiple times
                const toastInstance = result.current.toast({ title: 'Test' })
                result.current.dismiss(toastInstance.id)
                result.current.dismiss(toastInstance.id)
                result.current.dismiss(toastInstance.id)
            })

            // Should only create one timeout
            expect(mockSetTimeout).toHaveBeenCalledTimes(1)

            jest.useRealTimers()
            mockSetTimeout.mockRestore()
        })
    })
})