"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, ShoppingBag, Heart, MapPin, Star, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const accountNav = [
  { label: "Dashboard", href: "/my-account", icon: User },
  { label: "Orders", href: "/my-account/orders", icon: ShoppingBag },
  { label: "Wishlist", href: "/my-account/wishlist", icon: Heart },
  { label: "Addresses", href: "/my-account/addresses", icon: MapPin },
  { label: "Reviews", href: "/my-account/reviews", icon: Star },
  { label: "Settings", href: "/my-account/settings", icon: Settings },
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="glass rounded-xl p-4 space-y-2 sticky top-20">
              {accountNav.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  )
}
