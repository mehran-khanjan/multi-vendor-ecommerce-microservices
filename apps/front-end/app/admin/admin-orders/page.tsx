"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Search, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockOrders } from "@/lib/mock-data"

export default function AdminOrdersPage() {
  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Orders</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage {mockOrders.length} orders</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex gap-2"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
          <Input placeholder="Search orders..." className="pl-10 rounded-lg" />
        </div>
      </motion.div>

      {/* Orders List - Card Style */}
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
                <Badge
                  className={
                    order.status === "delivered"
                      ? "bg-green-600"
                      : order.status === "shipped"
                        ? "bg-blue-600"
                        : "bg-yellow-600"
                  }
                >
                  {order.status}
                </Badge>
              </div>
              <Button asChild variant="ghost" size="icon">
                <Link href={`/admin/orders/${order.id}`}>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
