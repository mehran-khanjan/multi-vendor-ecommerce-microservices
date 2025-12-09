"use client"

import { motion } from "framer-motion"
import { DollarSign, TrendingUp, Calendar } from "lucide-react"

const payouts = [
  { id: "PAY-001", amount: "$2,450.50", status: "completed", date: "2026-01-15" },
  { id: "PAY-002", amount: "$1,890.25", status: "processing", date: "2026-01-08" },
  { id: "PAY-003", amount: "$3,120.75", status: "completed", date: "2026-01-01" },
]

export default function VendorPayoutsPage() {
  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Payouts</h1>
        <p className="text-zinc-600 dark:text-zinc-400">View and manage your earnings</p>
      </motion.div>

      {/* Summary */}
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
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {[
          { icon: DollarSign, label: "Total Earnings", value: "$7,461.50" },
          { icon: TrendingUp, label: "This Month", value: "$2,450.50" },
          { icon: Calendar, label: "Next Payout", value: "Feb 01" },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6"
            >
              <Icon className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{item.label}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{item.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Payout History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Payout History</h2>
        <div className="space-y-4">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg"
            >
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{payout.id}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{payout.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{payout.amount}</p>
                <p
                  className={`text-xs font-medium capitalize ${
                    payout.status === "completed" ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {payout.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
