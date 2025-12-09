"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Search, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StarRating } from "@/components/ui/star-rating"
import { mockVendors } from "@/lib/mock-data"

export default function AdminVendorsPage() {
  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Vendors</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage {mockVendors.length} vendors</p>
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
          <Input placeholder="Search vendors..." className="pl-10 rounded-lg" />
        </div>
      </motion.div>

      {/* Vendors List - Card Style */}
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
        {mockVendors.map((vendor) => (
          <motion.div
            key={vendor.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Image
                src={vendor.logo || "/placeholder.svg"}
                alt={vendor.name}
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{vendor.name}</p>
                <StarRating rating={vendor.rating} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {vendor.followers.toLocaleString()} followers
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-lg bg-transparent">
                  <Link href={`/store/${vendor.slug}`}>
                    <Eye className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg text-red-600 bg-transparent">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
