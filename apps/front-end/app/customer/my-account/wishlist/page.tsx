"use client"

import { motion } from "framer-motion"
import { ProductCard } from "@/components/ui/product-card"
import { mockWishlist } from "@/lib/mock-data"

export default function WishlistPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Wishlist</h2>

      {mockWishlist.length > 0 ? (
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
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {mockWishlist.map((product) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ProductCard {...product} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400">Your wishlist is empty</p>
        </div>
      )}
    </motion.div>
  )
}
