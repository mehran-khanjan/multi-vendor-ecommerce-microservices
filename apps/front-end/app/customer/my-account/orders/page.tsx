"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockOrders } from "@/lib/mock-data"

export default function OrdersPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Your Orders</h2>

      {mockOrders.map((order) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-xl p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{order.id}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Date</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{order.date}</p>
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Items</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{order.items}</p>
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Total</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">${order.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Status</p>
                  <p
                    className={`font-medium capitalize ${
                      order.status === "delivered"
                        ? "text-green-600"
                        : order.status === "shipped"
                          ? "text-blue-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {order.status}
                  </p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
