"use client"

import Link from "next/link"
import Image from "next/image"
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { mockProducts } from "@/lib/mock-data"

export default function CartPage() {
  const cartItems = mockProducts.slice(0, 3).map((p) => ({
    ...p,
    quantity: Math.floor(Math.random() * 3) + 1,
  }))

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 10
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">Shopping Cart</h1>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
              <div className="glass rounded-xl p-6 space-y-4">
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                  >
                    <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{item.name}</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{item.vendor}</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                      <Button variant="ghost" size="icon" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <Button variant="ghost" size="sm" className="rounded-none">
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <Button variant="ghost" size="sm" className="rounded-none">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-6 h-fit sticky top-24"
            >
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Order Summary</h2>

              <div className="space-y-3 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
                  <span className="text-zinc-900 dark:text-zinc-100">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Shipping</span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Tax</span>
                  <span className="text-zinc-900 dark:text-zinc-100">${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold mb-6 pt-6">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <Button asChild className="w-full rounded-lg mb-3">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-lg bg-transparent">
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </motion.div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <ShoppingBag className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Your cart is empty</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">Add some products to get started!</p>
            <Button asChild className="rounded-lg">
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
