import { render, screen } from '@/tests/utils/test-utils'
import Loading from '@/app/admin/orders/loading'

describe('Loading Components', () => {
    test('orders loading component returns null', () => {
        const { container } = render(<Loading />)
        expect(container.firstChild).toBeNull()
    })

    test('products loading component returns null', () => {
        const LoadingProducts = require('@/app/admin/products/loading').default
        const { container } = render(<LoadingProducts />)
        expect(container.firstChild).toBeNull()
    })

    test('users loading component returns null', () => {
        const LoadingUsers = require('@/app/admin/users/loading').default
        const { container } = render(<LoadingUsers />)
        expect(container.firstChild).toBeNull()
    })

    test('vendors loading component returns null', () => {
        const LoadingVendors = require('@/app/admin/vendors/loading').default
        const { container } = render(<LoadingVendors />)
        expect(container.firstChild).toBeNull()
    })
})