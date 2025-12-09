"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"

interface ReviewResponseData {
  response: string
}

export default function VendorReviewResponsePage({ params }: { params: { slug: string } }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewResponseData>({
    mode: "onBlur",
  })

  const onSubmit = (data: ReviewResponseData) => {
    console.log("Review response:", data)
  }

  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/vendor/reviews"
          className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reviews
        </Link>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">Respond to Review</h1>

          {/* Customer Review */}
          <div className="glass rounded-xl p-6 mb-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">John Doe</h3>
                <StarRating rating={5} />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Wireless Headphones • 2026-01-15</p>
              <p className="text-zinc-600 dark:text-zinc-400">"Excellent product, fast shipping!"</p>
            </div>
          </div>

          {/* Response Form - Chat Style */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Your Response</h3>

            {/* Chat History Simulation */}
            <div className="mb-6 space-y-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-end">
                <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-2xl rounded-tr-sm px-4 py-2 max-w-xs">
                  <p className="text-sm">Type your response here...</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Message</label>
                <textarea
                  placeholder="Thank you for your review! We appreciate your feedback..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 ${
                    errors.response ? "border-red-500" : ""
                  }`}
                  {...register("response", {
                    required: "Response is required",
                    minLength: { value: 10, message: "Response must be at least 10 characters" },
                  })}
                />
                {errors.response && <p className="text-red-500 text-sm mt-1">{errors.response.message}</p>}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" asChild className="rounded-lg flex-1 bg-transparent">
                  <Link href="/vendor/reviews">Cancel</Link>
                </Button>
                <Button type="submit" className="rounded-lg flex-1 gap-2">
                  <Send className="w-4 h-4" />
                  Send Response
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
