"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Award, Users, Globe } from "lucide-react"
import { StarRating } from "@/components/ui/star-rating"
import { mockVendors } from "@/lib/mock-data"

export default function VendorAboutPage({ params }: { params: { username: string } }) {
  const vendor = mockVendors.find((v) => v.slug === params.username)

  if (!vendor) {
    return (
      <div className="pt-24 pb-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Store not found</p>
      </div>
    )
  }

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
          {/* Header */}
          <div className="text-center">
            <div className="mb-6">
              <Image
                src={vendor.logo || "/placeholder.svg"}
                alt={vendor.name}
                width={100}
                height={100}
                className="mx-auto rounded-xl"
              />
            </div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">{vendor.name}</h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">{vendor.description}</p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <StarRating rating={vendor.rating} />
              <span className="text-zinc-600 dark:text-zinc-400">{vendor.followers.toLocaleString()} followers</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Award, label: "Years Active", value: "5+" },
              { icon: Users, label: "Customers", value: "50K+" },
              { icon: Globe, label: "Countries", value: "15+" },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="glass rounded-xl p-6 text-center">
                  <Icon className="w-8 h-8 mx-auto mb-3 text-zinc-600 dark:text-zinc-400" />
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{stat.label}</p>
                </div>
              )
            })}
          </div>

          {/* About Section */}
          <div className="glass rounded-xl p-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">About Us</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              We are a leading retailer dedicated to providing high-quality products and exceptional customer service.
              Our mission is to make premium products accessible to everyone while maintaining the highest standards of
              quality and reliability.
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              With over 5 years of experience in the marketplace, we have built strong relationships with our customers
              by consistently delivering on our promises and exceeding expectations.
            </p>
          </div>

          {/* Contact */}
          <div className="glass rounded-xl p-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Contact Us</h2>
            <div className="space-y-3 text-zinc-600 dark:text-zinc-400">
              <p>Email: contact@{vendor.slug}.local</p>
              <p>Support Hours: Monday - Friday, 9AM - 6PM EST</p>
              <p>Response Time: Usually within 2 hours</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
