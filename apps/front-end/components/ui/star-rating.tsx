import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  reviews?: number
  size?: "sm" | "md" | "lg"
}

export function StarRating({ rating, reviews, size = "md" }: StarRatingProps) {
  const sizeMap = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${sizeMap[size]} ${
              i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-700"
            }`}
          />
        ))}
      </div>
      {reviews !== undefined && (
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {rating} ({reviews} reviews)
        </span>
      )}
    </div>
  )
}
