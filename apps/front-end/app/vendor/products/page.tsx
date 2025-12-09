"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockProducts } from "@/lib/mock-data"

export default function VendorProductsPage() {
  const vendorProducts = mockProducts.slice(0, 5)

  return (
    <div className="p-6 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Products</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Manage {vendorProducts.length} products</p>
        </div>
        <Button asChild className="gap-2 rounded-lg">
          <Link href="/vendor/products/new">
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </Button>
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
        className="space-y-4"
      >
        {vendorProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6 flex items-center gap-4"
          >
            <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{product.name}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                ${product.price.toFixed(2)} • {product.reviews} reviews •{" "}
                {product.inStock ? "In stock" : "Out of stock"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                <Eye className="w-4 h-4" />
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-lg bg-transparent">
                <Link href={`/vendor/products/${product.id}/edit`}>
                  <Edit className="w-4 h-4" />
                </Link>
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
