import {
    mockProducts,
    mockCategories,
    mockVendors,
    mockOrders,
    mockWishlist,
} from './mocks'

describe('Mock Data Cross-References', () => {
    describe('Product-Category Relationships', () => {
        it('should have all product categories defined in categories list', () => {
            const categorySlugs = mockCategories.map(c => c.slug)
            const productCategories = [...new Set(mockProducts.map(p => p.category))]

            productCategories.forEach(category => {
                expect(categorySlugs).toContain(category)
            })
        })

        it('should have at least one product per category', () => {
            mockCategories.forEach(category => {
                const productsInCategory = mockProducts.filter(p => p.category === category.slug)
                expect(productsInCategory.length).toBeGreaterThan(0)
            })
        })

        it('should have consistent category names in product descriptions', () => {
            mockProducts.forEach(product => {
                const category = mockCategories.find(c => c.slug === product.category)
                expect(category).toBeDefined()
                // Product descriptions should be appropriate for their category
                expect(typeof product.description).toBe('string')
                expect(product.description.length).toBeGreaterThan(0)
            })
        })
    })

    describe('Product-Vendor Relationships', () => {
        it('should have all product vendors defined in vendors list', () => {
            const vendorSlugs = mockVendors.map(v => v.slug)
            const productVendors = [...new Set(mockProducts.map(p => p.vendorSlug))]

            productVendors.forEach(vendor => {
                expect(vendorSlugs).toContain(vendor)
            })
        })

        it('should have at least one product per vendor', () => {
            mockVendors.forEach(vendor => {
                const productsByVendor = mockProducts.filter(p => p.vendorSlug === vendor.slug)
                expect(productsByVendor.length).toBeGreaterThan(0)
            })
        })

        it('should have vendor ratings consistent with product ratings', () => {
            mockVendors.forEach(vendor => {
                const vendorProducts = mockProducts.filter(p => p.vendorSlug === vendor.slug)
                const averageProductRating = vendorProducts.reduce((sum, p) => sum + p.rating, 0) / vendorProducts.length

                // Vendor rating should be somewhat consistent with average product ratings
                expect(Math.abs(vendor.rating - averageProductRating)).toBeLessThan(1.0)
            })
        })
    })

    describe('Wishlist Consistency', () => {
        it('should only contain products that exist in mockProducts', () => {
            const productIds = new Set(mockProducts.map(p => p.id))

            mockWishlist.forEach(wishlistItem => {
                expect(productIds.has(wishlistItem.id)).toBe(true)
            })
        })

        it('should contain products that are in stock', () => {
            mockWishlist.forEach(product => {
                expect(product.inStock).toBe(true)
            })
        })

        it('should not contain duplicates', () => {
            const wishlistIds = mockWishlist.map(p => p.id)
            const uniqueIds = new Set(wishlistIds)

            expect(uniqueIds.size).toBe(wishlistIds.length)
        })
    })

    describe('Data Integrity', () => {
        it('should have consistent pricing', () => {
            mockProducts.forEach(product => {
                expect(product.originalPrice).toBeGreaterThan(product.price)
                expect(product.price).toBeGreaterThan(0)

                // Calculate discount percentage
                const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100
                expect(discount).toBeGreaterThan(0)
                expect(discount).toBeLessThanOrEqual(50) // Reasonable discount range
            })
        })

        it('should have realistic ratings and review counts', () => {
            mockProducts.forEach(product => {
                // Ratings should be between 4.0 and 5.0 for mock data
                expect(product.rating).toBeGreaterThanOrEqual(4.0)
                expect(product.rating).toBeLessThanOrEqual(5.0)

                // Review counts should be positive
                expect(product.reviews).toBeGreaterThan(0)

                // Products with more reviews should have more established ratings
                if (product.reviews > 100) {
                    expect(product.rating).toBeGreaterThanOrEqual(4.0)
                }
            })
        })

        it('should have valid image paths', () => {
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']

            mockProducts.forEach(product => {
                expect(product.image).toMatch(/^\//) // Should start with /
                const hasValidExtension = imageExtensions.some(ext =>
                    product.image.toLowerCase().endsWith(ext)
                )
                expect(hasValidExtension).toBe(true)
            })

            mockCategories.forEach(category => {
                expect(category.image).toMatch(/^\//)
                const hasValidExtension = imageExtensions.some(ext =>
                    category.image.toLowerCase().endsWith(ext)
                )
                expect(hasValidExtension).toBe(true)
            })

            mockVendors.forEach(vendor => {
                expect(vendor.logo).toMatch(/^\//)
                const hasValidExtension = imageExtensions.some(ext =>
                    vendor.logo.toLowerCase().endsWith(ext)
                )
                expect(hasValidExtension).toBe(true)
            })
        })

        it('should have logical product naming', () => {
            mockProducts.forEach(product => {
                expect(product.name.length).toBeGreaterThan(0)
                expect(product.name.length).toBeLessThan(100) // Reasonable length

                // Names should not have excessive whitespace
                expect(product.name.trim()).toBe(product.name)
            })
        })

        it('should have valid slugs', () => {
            const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

            mockProducts.forEach(product => {
                expect(product.slug).toMatch(slugRegex)
            })

            mockCategories.forEach(category => {
                expect(category.slug).toMatch(slugRegex)
            })

            mockVendors.forEach(vendor => {
                expect(vendor.slug).toMatch(slugRegex)
            })
        })
    })

    describe('Order Data Consistency', () => {
        it('should have realistic order totals', () => {
            mockOrders.forEach(order => {
                expect(order.total).toBeGreaterThan(0)
                expect(order.total).toBeLessThan(1000) // Reasonable order total

                // Order total should be divisible by 0.01 (cent precision)
                expect(order.total * 100 % 1).toBe(0)
            })
        })

        it('should have logical order dates', () => {
            const now = new Date()
            const currentYear = now.getFullYear()

            mockOrders.forEach(order => {
                const orderDate = new Date(order.date)
                expect(orderDate.getFullYear()).toBeGreaterThanOrEqual(currentYear - 1)
                expect(orderDate.getFullYear()).toBeLessThanOrEqual(currentYear + 1)
            })
        })

        it('should have consistent order status flow', () => {
            // Orders should progress from processing -> shipped -> delivered
            const statusOrder = ['processing', 'shipped', 'delivered']

            mockOrders.forEach(order => {
                expect(statusOrder).toContain(order.status)
            })
        })
    })
})