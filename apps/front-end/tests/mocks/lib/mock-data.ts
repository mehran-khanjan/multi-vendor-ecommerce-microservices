export const mockCategories = [
    { id: '1', name: 'Electronics', productCount: 42, createdAt: '2024-01-01' },
    { id: '2', name: 'Clothing', productCount: 28, createdAt: '2024-01-02' },
    { id: '3', name: 'Home & Garden', productCount: 15, createdAt: '2024-01-03' },
]

export const mockOrders = [
    { id: 'ORD-001', date: '2024-01-15', items: 3, total: 249.99, status: 'pending' },
    { id: 'ORD-002', date: '2024-01-14', items: 1, total: 89.99, status: 'shipped' },
    { id: 'ORD-003', date: '2024-01-13', items: 5, total: 549.99, status: 'delivered' },
]

export const mockProducts = [
    { id: '1', name: 'Wireless Headphones', price: 199.99, vendor: 'TechCorp', reviews: 128, inStock: true },
    { id: '2', name: 'Laptop Stand', price: 49.99, vendor: 'ErgoWorks', reviews: 56, inStock: false },
]

export const mockVendors = [
    { id: '1', name: 'TechCorp', rating: 4.5, followers: 15000, slug: 'techcorp' },
    { id: '2', name: 'FashionHub', rating: 4.2, followers: 8900, slug: 'fashionhub' },
]