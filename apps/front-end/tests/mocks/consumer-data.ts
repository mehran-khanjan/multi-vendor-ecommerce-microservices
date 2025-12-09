import { MockProduct, MockCategory, MockVendor } from '@/lib/mock-data'

export const mockProducts: MockProduct[] = [
    {
        id: '1',
        name: 'Wireless Headphones Pro',
        price: 199.99,
        originalPrice: 249.99,
        description: 'Premium wireless headphones with noise cancellation',
        rating: 4.5,
        reviews: 128,
        vendor: 'TechCorp',
        vendorSlug: 'techcorp',
        category: 'electronics',
        inStock: true,
        image: '/placeholder-headphones.jpg',
        slug: 'wireless-headphones-pro',
    },
    {
        id: '2',
        name: 'Organic Cotton T-Shirt',
        price: 29.99,
        originalPrice: 39.99,
        description: '100% organic cotton t-shirt',
        rating: 4.2,
        reviews: 56,
        vendor: 'EcoWear',
        vendorSlug: 'ecowear',
        category: 'clothing',
        inStock: false,
        image: '/placeholder-tshirt.jpg',
        slug: 'organic-cotton-tshirt',
    },
]

export const mockCategories: MockCategory[] = [
    {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Latest gadgets and devices',
        productCount: 250,
        image: '/placeholder-electronics.jpg',
    },
    {
        id: '2',
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        productCount: 180,
        image: '/placeholder-clothing.jpg',
    },
]

export const mockVendors: MockVendor[] = [
    {
        id: '1',
        name: 'TechCorp',
        slug: 'techcorp',
        description: 'Leading tech products retailer',
        rating: 4.7,
        followers: 15000,
        logo: '/placeholder-techcorp.jpg',
    },
    {
        id: '2',
        name: 'EcoWear',
        slug: 'ecowear',
        description: 'Sustainable clothing brand',
        rating: 4.3,
        followers: 8900,
        logo: '/placeholder-ecowear.jpg',
    },
]

export const mockWishlist = [
    { id: '1', name: 'Wireless Headphones Pro', price: 199.99, rating: 4.5, vendor: 'TechCorp', inStock: true },
    { id: '2', name: 'Smart Watch', price: 299.99, rating: 4.3, vendor: 'TechCorp', inStock: true },
]

export const mockOrders = [
    { id: 'ORD-001', date: '2024-01-15', items: 3, total: 249.99, status: 'pending' },
    { id: 'ORD-002', date: '2024-01-14', items: 1, total: 89.99, status: 'shipped' },
]