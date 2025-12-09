"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Account Settings</h2>

        {/* Profile Picture */}
        <div className="glass rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Profile Picture</h3>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Button variant="outline" className="rounded-lg bg-transparent">
              Upload New Photo
            </Button>
          </div>
        </div>

        {/* Personal Info */}
        <div className="glass rounded-xl p-6 space-y-4 mb-6">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">First Name</label>
              <Input placeholder="John" className="rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Last Name</label>
              <Input placeholder="Doe" className="rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Email</label>
              <Input type="email" placeholder="john@example.com" className="rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Phone</label>
              <Input type="tel" placeholder="+1 (555) 000-0000" className="rounded-lg" />
            </div>
          </div>
          <Button className="rounded-lg">Save Changes</Button>
        </div>

        {/* Password */}
        <div className="glass rounded-xl p-6 space-y-4 mb-6">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Change Password</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Current Password</label>
            <Input type="password" className="rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">New Password</label>
            <Input type="password" className="rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Confirm Password</label>
            <Input type="password" className="rounded-lg" />
          </div>
          <Button className="rounded-lg">Update Password</Button>
        </div>

        {/* Preferences */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Preferences</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Receive email notifications</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Receive promotional emails</span>
          </label>
          <Button className="rounded-lg">Save Preferences</Button>
        </div>
      </div>
    </motion.div>
  )
}
