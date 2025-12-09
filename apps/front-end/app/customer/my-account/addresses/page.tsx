"use client"

import { motion } from "framer-motion"
import { Plus, MapPin, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const mockAddresses = [
  {
    id: "1",
    name: "Home",
    address: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zip: "94102",
    isDefault: true,
  },
  {
    id: "2",
    name: "Work",
    address: "456 Market St",
    city: "San Francisco",
    state: "CA",
    zip: "94103",
    isDefault: false,
  },
]

export default function AddressesPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Saved Addresses</h2>
        <Button className="gap-2 rounded-lg">
          <Plus className="w-4 h-4" />
          Add Address
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockAddresses.map((address) => (
          <motion.div
            key={address.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6 relative"
          >
            {address.isDefault && (
              <div className="absolute top-4 right-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-3 py-1 rounded-lg">
                Default
              </div>
            )}

            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 text-zinc-600 dark:text-zinc-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{address.name}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{address.address}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {address.city}, {address.state} {address.zip}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg gap-2 flex-1 bg-transparent">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg gap-2 flex-1 bg-transparent">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
