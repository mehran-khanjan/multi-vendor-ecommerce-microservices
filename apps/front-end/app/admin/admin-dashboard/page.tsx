"use client"

import { motion } from "framer-motion"
import { Users, Store, ShoppingBag, BarChart3 } from "lucide-react"

const stats = [
  { icon: Users, label: "Total Users", value: "12,543", change: "+8.2%" },
  { icon: Store, label: "Active Vendors", value: "342", change: "+5.4%" },
  { icon: ShoppingBag, label: "Total Orders", value: "28,634", change: "+12.1%" },
  { icon: BarChart3, label: "Revenue", value: "$542,890", change: "+15.3%" },
]

const recentActivity = [
  { action: "New order placed", detail: "Order #ORD-12345", time: "2 minutes ago" },
  { action: "Vendor registered", detail: "TechHub Store", time: "15 minutes ago" },
  { action: "Payment received", detail: "$2,450.50", time: "1 hour ago" },
  { action: "Product flagged", detail: "Possible counterfeit", time: "2 hours ago" },
]

export default function AdminDashboard() {
  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Admin Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Welcome to your admin control center</p>
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
              <div className="flex items-start justify-between mb-3">
                <Icon className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                <span className="text-xs text-green-600 dark:text-green-400">{stat.change}</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{activity.action}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{activity.detail}</p>
              </div>
              <p className="text-xs text-zinc-500">{activity.time}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
