"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { AlertCircle, Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ params }: { params: { id: string } }) {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <AlertCircle className="w-20 h-20 mx-auto text-red-600 fill-red-100 dark:fill-red-900" />
          </motion.div>

          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Payment Failed</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Unfortunately, your payment could not be processed. Please try again or use a different payment method.
          </p>

          <div className="glass rounded-xl p-6 mb-8 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Error Code</p>
            <p className="text-lg font-mono text-zinc-900 dark:text-zinc-100">ERR-{params.id}</p>
          </div>

          <div className="space-y-2 mb-8 text-left">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-yellow-600 dark:text-yellow-400 mt-1">⚠️</div>
              <div className="text-sm text-yellow-900 dark:text-yellow-200">
                Your cart has been saved. You can retry the payment or contact support for assistance.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full rounded-lg gap-2">
              <Link href="/checkout">
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-lg gap-2 bg-transparent">
              <Link href="/cart">Return to Cart</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full rounded-lg gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
