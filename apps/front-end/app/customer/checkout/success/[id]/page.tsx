"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2, Home, ShoppingBag, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SuccessPage({ params }: { params: { id: string } }) {
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
            <CheckCircle2 className="w-20 h-20 mx-auto text-green-600 fill-green-100 dark:fill-green-900" />
          </motion.div>

          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Order Confirmed!</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Thank you for your purchase. Your order has been confirmed and will be shipped soon.
          </p>

          <div className="glass rounded-xl p-6 mb-8 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Order Number</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{params.id}</p>
          </div>

          <div className="space-y-2 mb-8 text-left">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-blue-600 dark:text-blue-400 mt-1">ℹ️</div>
              <div className="text-sm text-blue-900 dark:text-blue-200">
                A confirmation email has been sent to your registered email address with tracking information.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full rounded-lg gap-2">
              <Link href="/my-account/orders">
                <ShoppingBag className="w-4 h-4" />
                View Order Details
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-lg gap-2 bg-transparent">
              <Link href="/">
                <Home className="w-4 h-4" />
                Continue Shopping
              </Link>
            </Button>
            <Button variant="ghost" className="w-full rounded-lg gap-2">
              <Download className="w-4 h-4" />
              Download Invoice
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
