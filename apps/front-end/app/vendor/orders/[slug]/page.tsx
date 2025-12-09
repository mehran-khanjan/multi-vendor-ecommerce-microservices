"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Package, Truck, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockOrders } from "@/lib/mock-data"

export default function VendorOrderDetailPage({ params }: { params: { slug: string } }) {
  const order = mockOrders.find((o) => o.id === params.slug) || mockOrders[0]

  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/vendor/orders"
          className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{order.id}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{order.date}</p>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Order Status</h2>
              <div className="space-y-4">
                {[
                  { icon: Package, label: "Order Placed", status: "completed" },
                  {
                    icon: Truck,
                    label: "Shipped",
                    status: order.status === "shipped" || order.status === "delivered" ? "completed" : "pending",
                  },
                  {
                    icon: CheckCircle,
                    label: "Delivered",
                    status: order.status === "delivered" ? "completed" : "pending",
                  },
                ].map((step, i) => {
                  const Icon = step.icon
                  const isCompleted = step.status === "completed"
                  return (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <Icon className={`w-6 h-6 ${isCompleted ? "text-green-600" : "text-zinc-400"}`} />
                        {i < 2 && (
                          <div
                            className={`w-0.5 h-12 ${isCompleted ? "bg-green-600" : "bg-zinc-200 dark:bg-zinc-800"}`}
                          />
                        )}
                      </div>
                      <div className="pt-1">
                        <p
                          className={`font-medium ${isCompleted ? "text-green-600" : "text-zinc-600 dark:text-zinc-400"}`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Order Items</h2>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">Premium Wireless Headphones</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Qty: 1</p>
                    </div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">$299.99</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Shipping Address</h2>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">John Doe</p>
                <p>123 Main Street</p>
                <p>San Francisco, CA 94102</p>
                <p>United States</p>
                <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">+1 (555) 000-0000</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="glass rounded-xl p-6 h-fit">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Order Summary</h2>

            <div className="space-y-3 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
                <span className="text-zinc-900 dark:text-zinc-100">$599.98</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Shipping</span>
                <span className="text-zinc-900 dark:text-zinc-100">$10.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Tax</span>
                <span className="text-zinc-900 dark:text-zinc-100">$48.00</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mb-6 pt-6">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <Button className="w-full rounded-lg" disabled={order.status !== "processing"}>
                {order.status === "processing" ? "Mark as Shipped" : "Already Shipped"}
              </Button>
              <Button variant="outline" className="w-full rounded-lg bg-transparent">
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
