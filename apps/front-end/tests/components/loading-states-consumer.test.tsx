import { render, screen } from '@/tests/utils/test-utils'
import Loading from '@/app/search/loading'

describe('Consumer Loading Components', () => {
    test('search loading component returns null', () => {
        const { container } = render(<Loading />)
        expect(container.firstChild).toBeNull()
    })

    test('loading components are lightweight', () => {
        // Test that loading components don't render anything
        const { container } = render(<Loading />)
        expect(container.innerHTML).toBe('')
    })
})