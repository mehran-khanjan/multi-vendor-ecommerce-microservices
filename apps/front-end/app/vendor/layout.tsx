"use client"

import type React from "react"

import { VendorLayout } from "@/components/layout/vendor-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <VendorLayout>{children}</VendorLayout>
}
