"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Search, Edit, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mockProducts } from "@/lib/mock-data"

export default function AdminProductsPage() {
  const products = mockProducts.slice(0, 6)

  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Products</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage {products.length} products</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex gap-2"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
          <Input placeholder="Search products..." className="pl-10 rounded-lg" />
        </div>
      </motion.div>

      {/* Products List - Card Style */}
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
        className="space-y-4"
      >
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6 flex items-center gap-4"
          >
            <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
            </div>

            <div className="flex-1">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{product.name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {product.vendor} • ${product.price.toFixed(2)} • {product.reviews} reviews
              </p>
            </div>
            <div className="flex gap-2">
              {!product.inStock && (
                <Button variant="outline" size="sm" className="rounded-lg text-yellow-600 bg-transparent">
                  <AlertTriangle className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg text-red-600 bg-transparent">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
