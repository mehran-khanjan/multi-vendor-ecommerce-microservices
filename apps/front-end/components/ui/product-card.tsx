"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingCart } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  originalPrice: number
  image: string
  rating: number
  reviews: number
  vendor: string
  vendorSlug: string
  inStock: boolean
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  vendor,
  vendorSlug,
  inStock,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Link href={`/shop/${slug}`}>
        <div className="relative overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover-lift">
          {/* Image */}
          <div className="relative h-64 overflow-hidden">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {!inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-medium">Out of Stock</span>
              </div>
            )}
            {discount > 0 && <Badge className="absolute top-4 right-4 bg-red-600 text-white">-{discount}%</Badge>}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 text-sm">{name}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{vendor}</p>

            {/* Rating */}
            <div className="mt-2">
              <StarRating rating={rating} reviews={reviews} size="sm" />
            </div>

            {/* Price */}
            <div className="flex items-baseline space-x-2 mt-3">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">${price.toFixed(2)}</span>
              {originalPrice > price && (
                <span className="text-sm text-zinc-500 dark:text-zinc-500 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1 h-9 rounded-lg text-sm"
                disabled={!inStock}
                onClick={(e) => {
                  e.preventDefault()
                }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg bg-transparent"
                onClick={(e) => {
                  e.preventDefault()
                  setIsWishlisted(!isWishlisted)
                }}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isWishlisted ? "fill-red-600 text-red-600" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
