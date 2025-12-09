"use client"

import { motion } from "framer-motion"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockCategories } from "@/lib/mock-data"

export default function AdminCategoriesPage() {
  return (
    <div className="p-6 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Categories</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Manage {mockCategories.length} categories</p>
        </div>
        <Button className="gap-2 rounded-lg">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </motion.div>

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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {mockCategories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{category.name}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg flex-1 gap-2 bg-transparent">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg flex-1 gap-2 text-red-600 bg-transparent">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}


