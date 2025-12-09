"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ProductCard } from "@/components/ui/product-card"
import { Button } from "@/components/ui/button"
import { mockVendors, mockProducts, mockCategories } from "@/lib/mock-data"

export default function VendorCategoryPage({
  params,
}: {
  params: { username: string; cat: string }
}) {
  const vendor = mockVendors.find((v) => v.slug === params.username)
  const category = mockCategories.find((c) => c.slug === params.cat)
  const products = mockProducts.filter((p) => p.vendorSlug === params.username && p.category === params.cat)

  if (!vendor || !category) {
    return (
      <div className="pt-24 pb-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Page not found</p>
      </div>
    )
  }

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <Button asChild variant="ghost" className="mb-4">
            <Link href={`/store/${vendor.slug}`}>← Back to Store</Link>
          </Button>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{category.name}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {products.length} products in {category.name} at {vendor.name}
          </p>
        </motion.div>

        {products.length > 0 ? (
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {products.map((product) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <ProductCard {...product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">No products found in this category.</p>
            <Button asChild>
              <Link href={`/store/${vendor.slug}`}>Browse All Products</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
