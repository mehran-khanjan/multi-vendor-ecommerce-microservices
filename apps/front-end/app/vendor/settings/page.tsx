"use client"

import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface VendorSettingsData {
  storeName: string
  description: string
  accountHolder: string
  accountNumber: string
  freeShipping: boolean
  international: boolean
}

export default function VendorSettingsPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorSettingsData>({
    mode: "onBlur",
    defaultValues: {
      storeName: "TechMart",
      description: "Leading electronics and tech products.",
      accountHolder: "",
      accountNumber: "",
      freeShipping: true,
      international: true,
    },
  })

  const onSubmitStoreInfo = (data: VendorSettingsData) => {
    console.log("Store info:", data)
  }

  return (
    <div className="p-6 sm:p-8 pt-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage your store settings and preferences</p>
      </motion.div>

      <div className="space-y-8 max-w-2xl">
        {/* Store Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-8 space-y-4"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Store Information</h2>
          <form onSubmit={handleSubmit(onSubmitStoreInfo)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Store Name</label>
              <Input
                placeholder="Your store name"
                className={`rounded-lg ${errors.storeName ? "border-red-500" : ""}`}
                {...register("storeName", {
                  required: "Store name is required",
                  minLength: { value: 2, message: "Store name must be at least 2 characters" },
                })}
              />
              {errors.storeName && <p className="text-red-500 text-sm mt-1">{errors.storeName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Store Description
              </label>
              <textarea
                placeholder="Describe your store..."
                className={`w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 ${
                  errors.description ? "border-red-500" : ""
                }`}
                rows={3}
                {...register("description", {
                  required: "Description is required",
                  minLength: { value: 10, message: "Description must be at least 10 characters" },
                })}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>
            <Button type="submit" className="rounded-lg">
              Save Store Info
            </Button>
          </form>
        </motion.div>

        {/* Bank Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-8 space-y-4"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Bank Details</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Account Holder Name
              </label>
              <Input
                placeholder="Name"
                className={`rounded-lg ${errors.accountHolder ? "border-red-500" : ""}`}
                {...register("accountHolder", {
                  required: "Account holder name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
              />
              {errors.accountHolder && <p className="text-red-500 text-sm mt-1">{errors.accountHolder.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Account Number</label>
              <Input
                type="password"
                placeholder="••••••••"
                className={`rounded-lg ${errors.accountNumber ? "border-red-500" : ""}`}
                {...register("accountNumber", {
                  required: "Account number is required",
                  minLength: { value: 8, message: "Account number must be at least 8 characters" },
                })}
              />
              {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber.message}</p>}
            </div>
            <Button type="button" className="rounded-lg">
              Update Bank Details
            </Button>
          </form>
        </motion.div>

        {/* Shipping Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-8 space-y-4"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Shipping Settings</h2>
          <form>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input type="checkbox" defaultChecked className="rounded" {...register("freeShipping")} />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Offer free shipping on orders over $50</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" defaultChecked className="rounded" {...register("international")} />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Enable international shipping</span>
            </label>
            <Button type="button" className="rounded-lg">
              Save Shipping Settings
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
