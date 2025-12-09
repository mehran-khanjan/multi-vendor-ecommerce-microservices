"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowRight, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/ui/product-card"
import { mockProducts, mockCategories } from "@/lib/mock-data"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function Home() {
  const featuredProducts = mockProducts.slice(0, 6)
  const blobRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!blobRef.current) return
      const rect = blobRef.current.parentElement?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      blobRef.current.style.setProperty("--blob-x", `${x}px`)
      blobRef.current.style.setProperty("--blob-y", `${y}px`)
    }

    const parent = blobRef.current?.parentElement
    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove)
      return () => parent.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div className="pt-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="grain absolute inset-0 pointer-events-none" />

        <div
          ref={blobRef}
          className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20"
          style={{
            background: `radial-gradient(circle 500px at var(--blob-x, 50%) var(--blob-y, 50%), rgba(24, 24, 27, 0.3), transparent 80%)`,
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-balance">
              Discover Your Next Favorite Product
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-balance mb-8">
              Shop from thousands of sellers offering premium products at competitive prices. Fast shipping, secure
              checkout, and exceptional customer support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-xl">
                <Link href="/shop">
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl bg-transparent">
                <Link href="/categories">Browse Categories</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16"
          >
            {[
              { label: "Active Sellers", value: "2,500+" },
              { label: "Products Available", value: "100,000+" },
              { label: "Happy Customers", value: "50,000+" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-6 text-center">
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{stat.value}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Shop by Category</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Explore our handpicked selection of categories</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {mockCategories.map((category) => (
            <motion.div key={category.id} variants={itemVariants}>
              <Link href={`/categories/${category.slug}`}>
                <div className="relative h-48 rounded-xl overflow-hidden group cursor-pointer">
                  <Image
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-end">
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <TrendingUp className="w-8 h-8" />
              Trending Now
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">Popular products loved by our community</p>
          </div>
          <Button asChild variant="outline" className="rounded-lg bg-transparent">
            <Link href="/shop">View All</Link>
          </Button>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featuredProducts.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard {...product} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Become a Vendor</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-2xl mx-auto">
            Start selling on our marketplace and reach thousands of customers. Fast setup, comprehensive tools, and
            dedicated support.
          </p>
          <Button asChild size="lg" className="rounded-xl">
            <Link href="/vendor/signup">
              Start Selling
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
