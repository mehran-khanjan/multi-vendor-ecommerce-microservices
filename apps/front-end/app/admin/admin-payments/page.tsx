"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { DollarSign, TrendingUp, AlertCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const paymentStats = [
  { icon: DollarSign, label: "Total Revenue", value: "$542,890", change: "+15.3%" },
  { icon: TrendingUp, label: "This Month", value: "$89,540", change: "+8.2%" },
  { icon: AlertCircle, label: "Pending Payouts", value: "$12,450", change: "-3.1%" },
]

const transactions = [
  { id: "TRX-001", vendor: "TechMart", amount: "$2,450.50", status: "completed", date: "2026-01-15" },
  { id: "TRX-002", vendor: "Fashion Co", amount: "$1,890.25", status: "pending", date: "2026-01-14" },
  { id: "TRX-003", vendor: "EcoLiving", amount: "$3,120.75", status: "completed", date: "2026-01-13" },
]

export default function AdminPaymentsPage() {
  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Payments</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Monitor platform revenue and payouts</p>
      </motion.div>

      {/* Stats */}
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
        {paymentStats.map((stat, i) => {
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

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Recent Transactions</h2>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{tx.vendor}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{tx.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{tx.amount}</p>
                  <p
                    className={`text-xs font-medium capitalize ${
                      tx.status === "completed" ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {tx.status}
                  </p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/admin/payments/${tx.id}`}>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
