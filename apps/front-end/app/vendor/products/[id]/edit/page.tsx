"use client"

import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EditProductFormData {
  name: string
  price: number
  originalPrice: number
  description: string
  stock: number
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProductFormData>({
    mode: "onBlur",
    defaultValues: {
      name: "Premium Wireless Headphones",
      price: 299.99,
      originalPrice: 399.99,
      description: "Experience pristine audio with active noise cancellation and 30-hour battery life.",
      stock: 50,
    },
  })

  const onSubmit = (data: EditProductFormData) => {
    console.log("Updated product:", data)
  }

  return (
    <div className="p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Edit Product</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">Update your product details</p>

        <div className="glass rounded-xl p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Product Name</label>
              <Input
                placeholder="Product name"
                className={`rounded-lg ${errors.name ? "border-red-500" : ""}`}
                {...register("name", {
                  required: "Product name is required",
                  minLength: { value: 3, message: "Name must be at least 3 characters" },
                })}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Price</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="299.99"
                  className={`rounded-lg ${errors.price ? "border-red-500" : ""}`}
                  {...register("price", {
                    required: "Price is required",
                    min: { value: 0, message: "Price must be positive" },
                  })}
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  Original Price
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="399.99"
                  className={`rounded-lg ${errors.originalPrice ? "border-red-500" : ""}`}
                  {...register("originalPrice", {
                    required: "Original price is required",
                    min: { value: 0, message: "Price must be positive" },
                  })}
                />
                {errors.originalPrice && <p className="text-red-500 text-sm mt-1">{errors.originalPrice.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Description</label>
              <textarea
                placeholder="Product description"
                className={`w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 ${
                  errors.description ? "border-red-500" : ""
                }`}
                rows={4}
                {...register("description", {
                  required: "Description is required",
                  minLength: { value: 10, message: "Description must be at least 10 characters" },
                })}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Stock</label>
              <Input
                type="number"
                placeholder="50"
                className={`rounded-lg ${errors.stock ? "border-red-500" : ""}`}
                {...register("stock", {
                  required: "Stock is required",
                  min: { value: 0, message: "Stock cannot be negative" },
                })}
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="rounded-lg flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg flex-1">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
