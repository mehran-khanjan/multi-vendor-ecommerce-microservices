import {
    mockProducts,
    mockCategories,
    mockVendors,
    mockOrders,
    mockWishlist,
} from './mocks'

describe('Mock Data', () => {
    describe('mockProducts', () => {
        it('should contain 12 products', () => {
            expect(mockProducts).toHaveLength(12)
        })

        it('should have required properties for each product', () => {
            mockProducts.forEach((product) => {
                expect(product).toHaveProperty('id')
                expect(product).toHaveProperty('name')
                expect(product).toHaveProperty('slug')
                expect(product).toHaveProperty('price')
                expect(product).toHaveProperty('originalPrice')
                expect(product).toHaveProperty('image')
                expect(product).toHaveProperty('rating')
                expect(product).toHaveProperty('reviews')
                expect(product).toHaveProperty('category')
                expect(product).toHaveProperty('vendor')
                expect(product).toHaveProperty('vendorSlug')
                expect(product).toHaveProperty('description')
                expect(product).toHaveProperty('inStock')
            })
        })

        it('should have valid data types', () => {
            mockProducts.forEach((product) => {
                expect(typeof product.id).toBe('string')
                expect(typeof product.name).toBe('string')
                expect(typeof product.slug).toBe('string')
                expect(typeof product.price).toBe('number')
                expect(typeof product.originalPrice).toBe('number')
                expect(typeof product.image).toBe('string')
                expect(typeof product.rating).toBe('number')
                expect(typeof product.reviews).toBe('number')
                expect(typeof product.category).toBe('string')
                expect(typeof product.vendor).toBe('string')
                expect(typeof product.vendorSlug).toBe('string')
                expect(typeof product.description).toBe('string')
                expect(typeof product.inStock).toBe('boolean')
            })
        })

        it('should have prices where original price is higher than sale price', () => {
            mockProducts.forEach((product) => {
                expect(product.originalPrice).toBeGreaterThan(product.price)
            })
        })

        it('should have ratings between 0 and 5', () => {
            mockProducts.forEach((product) => {
                expect(product.rating).toBeGreaterThanOrEqual(0)
                expect(product.rating).toBeLessThanOrEqual(5)
            })
        })

        it('should have positive review counts', () => {
            mockProducts.forEach((product) => {
                expect(product.reviews).toBeGreaterThan(0)
            })
        })

        it('should have unique IDs', () => {
            const ids = mockProducts.map(p => p.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
        })

        it('should have unique slugs', () => {
            const slugs = mockProducts.map(p => p.slug)
            const uniqueSlugs = new Set(slugs)
            expect(uniqueSlugs.size).toBe(slugs.length)
        })

        it('should have valid categories from predefined list', () => {
            const validCategories = ['electronics', 'apparel', 'home', 'fitness', 'stationery']
            mockProducts.forEach((product) => {
                expect(validCategories).toContain(product.category)
            })
        })
    })

    describe('mockCategories', () => {
        it('should contain 6 categories', () => {
            expect(mockCategories).toHaveLength(6)
        })

        it('should have required properties for each category', () => {
            mockCategories.forEach((category) => {
                expect(category).toHaveProperty('id')
                expect(category).toHaveProperty('name')
                expect(category).toHaveProperty('slug')
                expect(category).toHaveProperty('image')
            })
        })

        it('should have unique slugs', () => {
            const slugs = mockCategories.map(c => c.slug)
            const uniqueSlugs = new Set(slugs)
            expect(uniqueSlugs.size).toBe(slugs.length)
        })

        it('should have slugs that match product categories', () => {
            const categorySlugs = mockCategories.map(c => c.slug)
            const productCategories = mockProducts.map(p => p.category)

            productCategories.forEach((category) => {
                expect(categorySlugs).toContain(category)
            })
        })
    })

    describe('mockVendors', () => {
        it('should contain 3 vendors', () => {
            expect(mockVendors).toHaveLength(3)
        })

        it('should have required properties for each vendor', () => {
            mockVendors.forEach((vendor) => {
                expect(vendor).toHaveProperty('id')
                expect(vendor).toHaveProperty('name')
                expect(vendor).toHaveProperty('slug')
                expect(vendor).toHaveProperty('logo')
                expect(vendor).toHaveProperty('description')
                expect(vendor).toHaveProperty('rating')
                expect(vendor).toHaveProperty('followers')
            })
        })

        it('should have valid data types', () => {
            mockVendors.forEach((vendor) => {
                expect(typeof vendor.id).toBe('string')
                expect(typeof vendor.name).toBe('string')
                expect(typeof vendor.slug).toBe('string')
                expect(typeof vendor.logo).toBe('string')
                expect(typeof vendor.description).toBe('string')
                expect(typeof vendor.rating).toBe('number')
                expect(typeof vendor.followers).toBe('number')
            })
        })

        it('should have unique slugs', () => {
            const slugs = mockVendors.map(v => v.slug)
            const uniqueSlugs = new Set(slugs)
            expect(uniqueSlugs.size).toBe(slugs.length)
        })

        it('should have slugs that match product vendorSlug', () => {
            const vendorSlugs = mockVendors.map(v => v.slug)
            const productVendorSlugs = mockProducts.map(p => p.vendorSlug)

            productVendorSlugs.forEach((vendorSlug) => {
                expect(vendorSlugs).toContain(vendorSlug)
            })
        })

        it('should have ratings between 0 and 5', () => {
            mockVendors.forEach((vendor) => {
                expect(vendor.rating).toBeGreaterThanOrEqual(0)
                expect(vendor.rating).toBeLessThanOrEqual(5)
            })
        })

        it('should have positive follower counts', () => {
            mockVendors.forEach((vendor) => {
                expect(vendor.followers).toBeGreaterThan(0)
            })
        })
    })

    describe('mockOrders', () => {
        it('should contain 3 orders', () => {
            expect(mockOrders).toHaveLength(3)
        })

        it('should have required properties for each order', () => {
            mockOrders.forEach((order) => {
                expect(order).toHaveProperty('id')
                expect(order).toHaveProperty('date')
                expect(order).toHaveProperty('total')
                expect(order).toHaveProperty('status')
                expect(order).toHaveProperty('items')
            })
        })

        it('should have valid data types', () => {
            mockOrders.forEach((order) => {
                expect(typeof order.id).toBe('string')
                expect(typeof order.date).toBe('string')
                expect(typeof order.total).toBe('number')
                expect(typeof order.status).toBe('string')
                expect(typeof order.items).toBe('number')
            })
        })

        it('should have valid order IDs format', () => {
            mockOrders.forEach((order) => {
                expect(order.id).toMatch(/^ORD-\d{3}$/)
            })
        })

        it('should have valid dates', () => {
            mockOrders.forEach((order) => {
                const date = new Date(order.date)
                expect(date.toString()).not.toBe('Invalid Date')
            })
        })

        it('should have positive totals', () => {
            mockOrders.forEach((order) => {
                expect(order.total).toBeGreaterThan(0)
            })
        })

        it('should have valid statuses', () => {
            const validStatuses = ['delivered', 'processing', 'shipped']
            mockOrders.forEach((order) => {
                expect(validStatuses).toContain(order.status)
            })
        })

        it('should have positive item counts', () => {
            mockOrders.forEach((order) => {
                expect(order.items).toBeGreaterThan(0)
            })
        })

        it('should be sorted by date (newest first)', () => {
            const dates = mockOrders.map(o => new Date(o.date).getTime())
            for (let i = 0; i < dates.length - 1; i++) {
                expect(dates[i]).toBeGreaterThan(dates[i + 1])
            }
        })
    })

    describe('mockWishlist', () => {
        it('should contain 3 products', () => {
            expect(mockWishlist).toHaveLength(3)
        })

        it('should contain actual product objects from mockProducts', () => {
            mockWishlist.forEach((wishlistProduct) => {
                const originalProduct = mockProducts.find(p => p.id === wishlistProduct.id)
                expect(originalProduct).toBeDefined()
                expect(wishlistProduct).toEqual(originalProduct)
            })
        })

        it('should contain specific products based on indices', () => {
            const expectedProducts = [mockProducts[0], mockProducts[2], mockProducts[5]]
            expect(mockWishlist).toEqual(expectedProducts)
        })

        it('should have all wishlist products in stock', () => {
            mockWishlist.forEach((product) => {
                expect(product.inStock).toBe(true)
            })
        })
    })

    describe('Data consistency', () => {
        it('should have consistent category references', () => {
            const validCategorySlugs = mockCategories.map(c => c.slug)

            mockProducts.forEach((product) => {
                expect(validCategorySlugs).toContain(product.category)
            })
        })

        it('should have consistent vendor references', () => {
            const validVendorSlugs = mockVendors.map(v => v.slug)

            mockProducts.forEach((product) => {
                expect(validVendorSlugs).toContain(product.vendorSlug)
            })
        })

        it('should have vendors with products', () => {
            mockVendors.forEach((vendor) => {
                const vendorProducts = mockProducts.filter(p => p.vendorSlug === vendor.slug)
                expect(vendorProducts.length).toBeGreaterThan(0)
            })
        })

        it('should have categories with products', () => {
            mockCategories.forEach((category) => {
                const categoryProducts = mockProducts.filter(p => p.category === category.slug)
                expect(categoryProducts.length).toBeGreaterThan(0)
            })
        })
    })
})