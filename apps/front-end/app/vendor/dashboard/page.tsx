"use client"

import { motion } from "framer-motion"
import { ShoppingBag, TrendingUp, DollarSign, Users } from "lucide-react"

const stats = [
  { icon: ShoppingBag, label: "Total Orders", value: "248", trend: "+12.5%" },
  { icon: DollarSign, label: "Revenue", value: "$24,580", trend: "+8.2%" },
  { icon: TrendingUp, label: "Growth Rate", value: "23%", trend: "+3%" },
  { icon: Users, label: "Active Customers", value: "1,234", trend: "+15.3%" },
]

const recentOrders = [
  { id: "ORD-001", customer: "John Doe", amount: "$299.99", status: "completed", date: "2026-01-15" },
  { id: "ORD-002", customer: "Jane Smith", amount: "$149.98", status: "processing", date: "2026-01-14" },
  { id: "ORD-003", customer: "Bob Johnson", amount: "$89.99", status: "shipped", date: "2026-01-13" },
]

export default function VendorDashboard() {
  return (
    <div className="p-6 sm:p-8 pt-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Welcome back to your vendor dashboard</p>
      </motion.div>

      {/* Stats Grid */}
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-3">{stat.trend}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Recent Orders</h2>
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg"
            >
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{order.id}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{order.customer}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{order.amount}</p>
                <p
                  className={`text-xs capitalize ${
                    order.status === "completed"
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
          ))}
        </div>
      </motion.div>
    </div>
  )
}
