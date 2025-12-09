"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Download, MoreVertical, Ban, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { mockOrders } from "@/lib/mock-data"

export default function AdminOrderDetailPage({ params }: { params: { slug: string } }) {
  const order = mockOrders.find((o) => o.id === params.slug) || mockOrders[0]

  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/admin/orders"
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
          <div className="flex items-center gap-2">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-lg bg-transparent">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export Invoice
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Completed
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Ban className="w-4 h-4 mr-2" />
                  Cancel Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Customer Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Name</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">John Doe</p>
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Email</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">john@example.com</p>
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Phone</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">+1 (555) 000-0000</p>
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Order Date</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{order.date}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Shipping Address</h2>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">John Doe</p>
                <p>123 Main Street</p>
                <p>San Francisco, CA 94102</p>
                <p>United States</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Order Items ({order.items})</h2>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">Premium Wireless Headphones</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">SKU: WH-001</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">$299.99</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Qty: 1</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary & Actions */}
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
              <Button className="w-full rounded-lg gap-2">
                <CheckCircle className="w-4 h-4" />
                Approve Order
              </Button>
              <Button variant="outline" className="w-full rounded-lg gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Download Invoice
              </Button>
              <Button variant="destructive" className="w-full rounded-lg gap-2">
                <Ban className="w-4 h-4" />
                Reject Order
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
