"use client"

import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ProductCard } from "@/components/ui/product-card"
import { mockProducts } from "@/lib/mock-data"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const results = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Search Results</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {results.length} results found for "{query}"
          </p>
        </motion.div>

        {results.length > 0 ? (
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {results.map((product) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <ProductCard {...product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">No products found matching your search.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
