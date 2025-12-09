"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/ui/product-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { mockProducts, mockCategories } from "@/lib/mock-data"

type SortOption = "relevance" | "price-low" | "price-high" | "rating" | "newest"

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 })
  const [sortBy, setSortBy] = useState<SortOption>("relevance")

  const filteredProducts = useMemo(() => {
    let products = [...mockProducts]

    // Search filter
    if (searchQuery) {
      products = products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Category filter
    if (selectedCategory) {
      products = products.filter((p) => p.category === selectedCategory)
    }

    // Price filter
    products = products.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max)

    // Sorting
    if (sortBy === "price-low") {
      products.sort((a, b) => a.price - b.price)
    } else if (sortBy === "price-high") {
      products.sort((a, b) => b.price - a.price)
    } else if (sortBy === "rating") {
      products.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === "newest") {
      products.sort((a, b) => b.id.localeCompare(a.id))
    }

    return products
  }, [searchQuery, selectedCategory, priceRange, sortBy])

  return (
    <div className="pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Shop</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Browse our collection of {filteredProducts.length} products
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          {/* Sidebar Filters */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <div className="glass rounded-xl p-6 space-y-6 sticky top-20">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Search</label>
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Category</label>
                <div className="space-y-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "ghost"}
                    className="w-full justify-start text-left rounded-lg h-9"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Categories
                  </Button>
                  {mockCategories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.slug ? "default" : "ghost"}
                      className="w-full justify-start text-left rounded-lg h-9"
                      onClick={() => setSelectedCategory(cat.slug)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Price Range</label>
                <div className="space-y-3">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number.parseInt(e.target.value) })}
                    className="rounded-lg h-9"
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number.parseInt(e.target.value) })}
                    className="rounded-lg h-9"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                className="w-full rounded-lg h-9 bg-transparent"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory(null)
                  setPriceRange({ min: 0, max: 500 })
                }}
              >
                Clear Filters
              </Button>
            </div>
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{filteredProducts.length} products</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-lg gap-2 bg-transparent">
                    Sort
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("relevance")}>Relevance</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("price-low")}>Price: Low to High</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-high")}>Price: High to Low</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("rating")}>Top Rated</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Active Filters */}
            {(selectedCategory || searchQuery) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-2 rounded-lg px-3 py-1">
                    {mockCategories.find((c) => c.slug === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory(null)}>×</button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-2 rounded-lg px-3 py-1">
                    "{searchQuery}"<button onClick={() => setSearchQuery("")}>×</button>
                  </Badge>
                )}
              </div>
            )}

            {/* Products */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProductCard {...product} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">No products found matching your filters.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory(null)
                    setPriceRange({ min: 0, max: 500 })
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
