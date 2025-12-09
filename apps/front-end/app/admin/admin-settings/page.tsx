"use client"

import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AdminSettingsData {
  platformName: string
  supportEmail: string
  standardCommission: number
  premiumCommission: number
  require2FA: boolean
  paymentVerification: boolean
}

export default function AdminSettingsPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminSettingsData>({
    mode: "onBlur",
    defaultValues: {
      platformName: "E-Commerce",
      supportEmail: "support@ecommerce.local",
      standardCommission: 5,
      premiumCommission: 3,
      require2FA: true,
      paymentVerification: true,
    },
  })

  const onSubmitPlatform = (data: AdminSettingsData) => {
    console.log("Platform settings:", data)
  }

  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage platform settings and configuration</p>
      </motion.div>

      <div className="space-y-8 max-w-2xl">
        {/* Platform Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-8 space-y-4"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Platform Settings</h2>
          <form onSubmit={handleSubmit(onSubmitPlatform)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Platform Name</label>
              <Input
                placeholder="Platform name"
                className={`rounded-lg ${errors.platformName ? "border-red-500" : ""}`}
                {...register("platformName", {
                  required: "Platform name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
              />
              {errors.platformName && <p className="text-red-500 text-sm mt-1">{errors.platformName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Support Email</label>
              <Input
                type="email"
                placeholder="support@example.com"
                className={`rounded-lg ${errors.supportEmail ? "border-red-500" : ""}`}
                {...register("supportEmail", {
                  required: "Support email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.supportEmail && <p className="text-red-500 text-sm mt-1">{errors.supportEmail.message}</p>}
            </div>
            <Button type="submit" className="rounded-lg">
              Save Settings
            </Button>
          </form>
        </motion.div>

        {/* Commission Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-8 space-y-4"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Commission Settings</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  Standard Commission %
                </label>
                <Input
                  type="number"
                  placeholder="5"
                  className={`rounded-lg ${errors.standardCommission ? "border-red-500" : ""}`}
                  {...register("standardCommission", {
                    required: "Commission is required",
                    min: { value: 0, message: "Commission must be positive" },
                  })}
                />
                {errors.standardCommission && (
                  <p className="text-red-500 text-sm mt-1">{errors.standardCommission.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  Premium Commission %
                </label>
                <Input
                  type="number"
                  placeholder="3"
                  className={`rounded-lg ${errors.premiumCommission ? "border-red-500" : ""}`}
                  {...register("premiumCommission", {
                    required: "Commission is required",
                    min: { value: 0, message: "Commission must be positive" },
                  })}
                />
                {errors.premiumCommission && (
                  <p className="text-red-500 text-sm mt-1">{errors.premiumCommission.message}</p>
                )}
              </div>
            </div>
            <Button type="button" className="rounded-lg">
              Save Commission
            </Button>
          </form>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-8 space-y-4"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Security</h2>
          <form>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input type="checkbox" defaultChecked className="rounded" {...register("require2FA")} />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Require 2FA for admin accounts</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" defaultChecked className="rounded" {...register("paymentVerification")} />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Enable payment verification</span>
            </label>
            <Button type="button" className="rounded-lg">
              Save Security Settings
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
