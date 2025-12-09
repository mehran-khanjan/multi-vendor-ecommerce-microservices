"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"
import { ProductCard } from "@/components/ui/product-card"
import { mockVendors, mockProducts } from "@/lib/mock-data"

export default function VendorStorePage({ params }: { params: { username: string } }) {
  const vendor = mockVendors.find((v) => v.slug === params.username)
  const vendorProducts = mockProducts.filter((p) => p.vendorSlug === params.username)

  if (!vendor) {
    return (
      <div className="pt-24 pb-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Store not found</p>
      </div>
    )
  }

  return (
    <div className="pt-16 pb-16">
      {/* Vendor Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 py-12 mb-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex items-start gap-6 mb-6 sm:mb-0">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden">
                <Image src={vendor.logo || "/placeholder.svg"} alt={vendor.name} fill className="object-cover" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{vendor.name}</h1>
                <p className="text-zinc-600 dark:text-zinc-400 mb-3">{vendor.description}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <StarRating rating={vendor.rating} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <ShoppingBag className="w-4 h-4" />
                    {vendorProducts.length} products
                  </div>
                  <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {vendor.followers.toLocaleString()} followers
                  </div>
                </div>
              </div>
            </div>
            <Button className="rounded-xl">Follow Store</Button>
          </div>
        </div>
      </motion.div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Products</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Showing {vendorProducts.length} products from {vendor.name}
          </p>
        </motion.div>

        {vendorProducts.length > 0 ? (
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
            {vendorProducts.map((product) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <ProductCard {...product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600 dark:text-zinc-400">This store has no products yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
