"use client"

import { motion } from "framer-motion"
import { Search, Edit, Trash2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const mockUsers = [
  { id: "1", name: "John Doe", email: "john@example.com", status: "active", joined: "2024-06-15" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", status: "active", joined: "2024-08-20" },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", status: "inactive", joined: "2024-05-10" },
  { id: "4", name: "Alice Brown", email: "alice@example.com", status: "active", joined: "2024-11-01" },
]

export default function AdminUsersPage() {
  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Users</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage {mockUsers.length} users</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex gap-2"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
          <Input placeholder="Search users..." className="pl-10 rounded-lg" />
        </div>
      </motion.div>

      {/* Users List - Card Style */}
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
        {mockUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500" />
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${
                    user.status === "active"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {user.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                  <Shield className="w-4 h-4" />
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
