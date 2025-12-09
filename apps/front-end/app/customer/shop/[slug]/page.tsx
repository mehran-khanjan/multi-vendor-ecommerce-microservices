"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/ui/product-card"
import { StarRating } from "@/components/ui/star-rating"
import { Badge } from "@/components/ui/badge"
import { mockProducts } from "@/lib/mock-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProductPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  const product = slug ? mockProducts.find((p) => p.slug === slug) : undefined
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const relatedProducts = mockProducts.filter((p) => p.category === product?.category && p.id !== product.id)

  if (!slug || !product) {
    return (
      <div className="pt-24 pb-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Product not found</p>
        {slug && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
            No product found with slug: {slug}
          </p>
        )}
      </div>
    )
  }

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          {/* Product Image */}
          <div className="rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900">
            <div className="relative h-96 md:h-full min-h-96">
              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
              {discount > 0 && <Badge className="absolute top-4 right-4 bg-red-600 text-white">-{discount}%</Badge>}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-start">
            <div className="mb-6">
              <Link
                href={`/store/${product.vendorSlug}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3 inline-block"
              >
                {product.vendor}
              </Link>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">{product.name}</h1>
              <div className="flex items-center gap-4">
                <StarRating rating={product.rating} reviews={product.reviews} />
              </div>
            </div>

            {/* Price */}
            <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">${product.price.toFixed(2)}</span>
                <span className="text-lg text-zinc-500 line-through">${product.originalPrice.toFixed(2)}</span>
                {discount > 0 && <Badge className="bg-green-600">{discount}% OFF</Badge>}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{product.description}</p>
            </div>

            {/* Features */}
            <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
              {[
                { icon: Truck, label: "Free shipping on orders over $50" },
                { icon: Shield, label: "100% authentic and guaranteed" },
                { icon: RotateCcw, label: "30-day easy returns" },
              ].map((feature, i) => {
                const Icon = feature.icon
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{feature.label}</span>
                  </div>
                )
              })}
            </div>

            {/* Quantity & Actions */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Quantity:</span>
                <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="rounded-none"
                  >
                    −
                  </Button>
                  <span className="px-4">{quantity}</span>
                  <Button variant="ghost" size="sm" onClick={() => setQuantity(quantity + 1)} className="rounded-none">
                    +
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 rounded-lg gap-2 h-11" disabled={!product.inStock}>
                  <ShoppingCart className="w-5 h-5" />
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg h-11 w-11 bg-transparent"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isWishlisted ? "fill-red-600 text-red-600" : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  />
                </Button>
                <Button variant="outline" size="icon" className="rounded-lg h-11 w-11 bg-transparent">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Stock Status */}
            {!product.inStock && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This product is currently out of stock. You can notify us when it's back in stock.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs defaultValue="description" className="mb-16">
            <TabsList className="glass rounded-xl p-1 mb-6">
              <TabsTrigger value="description" className="rounded-lg">
                Description
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg">
                Reviews ({product.reviews})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description">
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Product Details</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">{product.description}</p>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">Category:</span> {product.category}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">Vendor:</span> {product.vendor}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Customer Reviews</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="pb-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Customer {i}</p>
                          <StarRating rating={5 - i} />
                        </div>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Great product, highly recommend!</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((related) => (
                <ProductCard key={related.id} {...related} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
