"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockOrders } from "@/lib/mock-data"

export default function VendorOrdersPage() {
  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Orders</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage {mockOrders.length} orders</p>
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
        {mockOrders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{order.id}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {order.date} • {order.items} item(s)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">${order.total.toFixed(2)}</p>
                <p
                  className={`text-xs font-medium capitalize ${
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
              <Button variant="ghost" size="icon">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
