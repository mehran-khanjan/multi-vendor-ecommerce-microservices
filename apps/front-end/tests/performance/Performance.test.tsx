import React from 'react'
import { render } from '@testing-library/react'
import { measurePerformance } from 'reassure'
import {
    Button,
    Input,
    ProductCard,
    AdminLayout,
    Footer
} from '@/components'

describe('Performance', () => {
    it('Button renders quickly', async () => {
        await measurePerformance(<Button>Test Button</Button>)
    })

    it('Input renders quickly with various states', async () => {
        await measurePerformance(
            <div>
                <Input placeholder="Default" />
                <Input disabled placeholder="Disabled" />
                <Input aria-invalid="true" placeholder="Error" />
            </div>
        )
    })

    it('ProductCard renders quickly with all features', async () => {
        const props = {
            id: '1',
            name: 'Performance Test Product',
            slug: 'performance-test',
            price: 99.99,
            originalPrice: 129.99,
            image: '/test.jpg',
            rating: 4.5,
            reviews: 123,
            vendor: 'Test Vendor',
            vendorSlug: 'test-vendor',
            inStock: true,
        }

        await measurePerformance(<ProductCard {...props} />)
    })

    it('AdminLayout renders quickly with many navigation items', async () => {
        await measurePerformance(
            <AdminLayout>
                <div className="p-6">
                    <h1>Dashboard</h1>
                    <p>Performance test content</p>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="p-4 border rounded mb-2">
                            Item {i + 1}
                        </div>
                    ))}
                </div>
            </AdminLayout>
        )
    })

    it('Footer renders quickly with all sections', async () => {
        await measurePerformance(<Footer />)
    })

    it('Multiple components render quickly together', async () => {
        await measurePerformance(
            <div className="min-h-screen">
                <AdminLayout>
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Products</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ProductCard
                                    key={i}
                                    id={i.toString()}
                                    name={`Product ${i + 1}`}
                                    slug={`product-${i + 1}`}
                                    price={99.99 + i * 10}
                                    originalPrice={129.99 + i * 10}
                                    image={`/product-${i + 1}.jpg`}
                                    rating={4 + (i % 5) / 2}
                                    reviews={100 + i * 20}
                                    vendor={`Vendor ${i + 1}`}
                                    vendorSlug={`vendor-${i + 1}`}
                                    inStock={i % 3 !== 0}
                                />
                            ))}
                        </div>
                    </div>
                </AdminLayout>
            </div>
        )
    })
})