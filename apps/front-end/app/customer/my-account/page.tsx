"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Calendar, Award, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { mockOrders } from "@/lib/mock-data"

export default function AccountDashboard() {
  return (
    <div className="space-y-8">
      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <Avatar className="w-20 h-20">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">John Doe</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Customer</p>
            </div>
          </div>
          <Button asChild className="rounded-lg">
            <Link href="/my-account/settings">Edit Profile</Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        {[
          { icon: ShoppingBag, label: "Total Orders", value: "12" },
          { icon: Award, label: "Loyalty Points", value: "1,240" },
          { icon: Mail, label: "Saved Addresses", value: "3" },
          { icon: Calendar, label: "Member Since", value: "2 years" },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="glass rounded-xl p-6 text-center">
              <Icon className="w-8 h-8 mx-auto mb-2 text-zinc-600 dark:text-zinc-400" />
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{stat.value}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{stat.label}</p>
            </div>
          )
        })}
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Recent Orders</h3>
          <Button asChild variant="outline" className="rounded-lg bg-transparent" size="sm">
            <Link href="/my-account/orders">View All</Link>
          </Button>
        </div>

        <div className="space-y-3">
          {mockOrders.slice(0, 3).map((order) => (
            <div key={order.id} className="glass rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{order.id}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {order.date} • {order.items} item(s)
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">${order.total.toFixed(2)}</p>
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
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
