import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from './useIsMobile'

describe('useIsMobile', () => {
    const originalInnerWidth = window.innerWidth
    const originalMatchMedia = window.matchMedia

    beforeEach(() => {
        // Reset window.innerWidth to default
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: originalInnerWidth,
        })
    })

    afterAll(() => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: originalInnerWidth,
        })
        window.matchMedia = originalMatchMedia
    })

    it('should return false for desktop width', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 1024,
        })

        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(false)
    })

    it('should return true for mobile width', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 767,
        })

        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(true)
    })

    it('should return true exactly at mobile breakpoint', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 767,
        })

        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(true)
    })

    it('should return false exactly at desktop breakpoint', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 768,
        })

        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(false)
    })

    it('should update when window resizes to mobile', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 1024,
        })

        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(false)

        // Mock resize event
        act(() => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                value: 500,
            })

            // Trigger the media query change
            const mockMediaQuery = window.matchMedia as jest.Mock
            const eventHandler = mockMediaQuery.mock.calls[0][1]?.change ||
                mockMediaQuery.mock.results[0].value.addEventListener.mock.calls[0][1]

            if (eventHandler) {
                eventHandler()
            }
        })

        expect(result.current).toBe(true)
    })

    it('should update when window resizes to desktop', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 500,
        })

        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(true)

        // Mock resize event
        act(() => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                value: 1024,
            })

            // Trigger the media query change
            const mockMediaQuery = window.matchMedia as jest.Mock
            const eventHandler = mockMediaQuery.mock.calls[0][1]?.change ||
                mockMediaQuery.mock.results[0].value.addEventListener.mock.calls[0][1]

            if (eventHandler) {
                eventHandler()
            }
        })

        expect(result.current).toBe(false)
    })

    it('should clean up event listener on unmount', () => {
        const mockRemoveEventListener = jest.fn()
        const mockMatchMedia = jest.fn().mockImplementation(() => ({
            matches: false,
            addEventListener: jest.fn(),
            removeEventListener: mockRemoveEventListener,
        }))

        window.matchMedia = mockMatchMedia

        const { unmount } = renderHook(() => useIsMobile())

        unmount()

        expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should handle undefined initial state', () => {
        // Test that the hook properly handles the initial undefined state
        const { result } = renderHook(() => useIsMobile())
        // The hook should return a boolean (false or true), never undefined
        expect(typeof result.current).toBe('boolean')
    })
})