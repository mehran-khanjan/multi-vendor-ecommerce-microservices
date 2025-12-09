"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ProductCard } from "@/components/ui/product-card"
import { Button } from "@/components/ui/button"
import { mockCategories, mockProducts } from "@/lib/mock-data"

export default function CategoryPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  const category = slug ? mockCategories.find((c) => c.slug === slug) : undefined
  const products = slug ? mockProducts.filter((p) => p.category === slug) : []

  if (!slug || !category) {
    return (
      <div className="pt-24 pb-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Category not found</p>
        {slug && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
            No category found with slug: {slug}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex items-center justify-between"
        >
          <div>
            <Button asChild variant="ghost" className="mb-4">
              <Link href="/categories">← Back</Link>
            </Button>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{category.name}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{products.length} products available</p>
          </div>
        </motion.div>

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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {products.map((product) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ProductCard {...product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
