"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Heart, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">About Us</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            We're building the future of multi-vendor e-commerce, connecting sellers and buyers worldwide.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 md:p-12 mb-16"
        >
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Our Mission</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
            Our mission is to empower entrepreneurs and businesses by providing an accessible, modern marketplace where
            they can reach a global audience. We believe in fair commerce, transparent pricing, and building lasting
            relationships between sellers and customers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {[
            { icon: Users, title: "Community First", desc: "Built for sellers and buyers to thrive together" },
            { icon: Zap, title: "Fast & Reliable", desc: "Lightning-fast checkout and instant order updates" },
            { icon: Heart, title: "Customer Care", desc: "24/7 support dedicated to your success" },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="glass rounded-xl p-6 text-center"
              >
                <Icon className="w-12 h-12 mx-auto mb-4 text-zinc-600 dark:text-zinc-400" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Button asChild size="lg" className="rounded-lg">
            <Link href="/shop">Start Exploring</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
