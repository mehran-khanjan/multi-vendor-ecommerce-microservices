"use client"

import { motion } from "framer-motion"
import { StarRating } from "@/components/ui/star-rating"

const mockReviews = [
  {
    id: "1",
    productName: "Premium Wireless Headphones",
    rating: 5,
    comment: "Excellent quality and amazing sound. Highly recommend!",
    date: "2026-01-10",
  },
  {
    id: "2",
    productName: "Organic Cotton T-Shirt",
    rating: 4,
    comment: "Great fit but took longer to arrive than expected.",
    date: "2026-01-05",
  },
]

export default function ReviewsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Reviews</h2>

      <div className="space-y-4">
        {mockReviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{review.productName}</h3>
            <StarRating rating={review.rating} />
            <p className="text-zinc-600 dark:text-zinc-400 mt-3 mb-3">{review.comment}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Reviewed on {review.date}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
