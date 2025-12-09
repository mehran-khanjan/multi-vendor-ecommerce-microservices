"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function NewProductPage() {
  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Add New Product</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">Create a new product listing for your store</p>

        <div className="glass rounded-xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Product Name</label>
            <Input placeholder="Enter product name" className="rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Price</label>
              <Input type="number" placeholder="0.00" className="rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Original Price</label>
              <Input type="number" placeholder="0.00" className="rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Description</label>
            <textarea
              placeholder="Describe your product"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Category</label>
            <select className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground">
              <option>Select a category</option>
              <option>Electronics</option>
              <option>Apparel</option>
              <option>Home & Garden</option>
            </select>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="rounded-lg flex-1 bg-transparent">
              Cancel
            </Button>
            <Button className="rounded-lg flex-1">Create Product</Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
