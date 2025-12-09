"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"

export default function VendorReviewsPage() {
  const reviews = [
    {
      id: 1,
      customer: "John Doe",
      rating: 5,
      product: "Wireless Headphones",
      comment: "Excellent product, fast shipping!",
      date: "2026-01-15",
    },
    {
      id: 2,
      customer: "Jane Smith",
      rating: 4,
      product: "USB Cable",
      comment: "Good quality but could be cheaper",
      date: "2026-01-10",
    },
    {
      id: 3,
      customer: "Bob Johnson",
      rating: 5,
      product: "Phone Case",
      comment: "Perfect fit and great protection",
      date: "2026-01-08",
    },
  ]

  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Reviews</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage customer reviews and respond to feedback</p>
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
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{review.customer}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{review.product}</p>
              </div>
              <div className="text-right">
                <StarRating rating={review.rating} />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{review.date}</p>
              </div>
            </div>

            <p className="text-zinc-600 dark:text-zinc-400 mb-4">{review.comment}</p>

            <Button asChild variant="outline" size="sm" className="rounded-lg gap-2 bg-transparent">
              <Link href={`/vendor/reviews/${review.id}`}>
                <MessageCircle className="w-4 h-4" />
                Respond
              </Link>
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
