import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProductCardSkeleton } from '@/skeletons/ProductCardSkeleton'

describe('ProductCardSkeleton', () => {
    it('renders skeleton elements correctly', () => {
        render(<ProductCardSkeleton />)

        // Check for all skeleton elements
        const skeletons = screen.getAllByTestId('skeleton')
        expect(skeletons).toHaveLength(6)

        // Image skeleton
        const imageSkeleton = screen.getByTestId('skeleton').closest('div')
        expect(imageSkeleton).toHaveClass('h-64', 'w-full')

        // Title skeleton
        const titleSkeleton = skeletons[1]
        expect(titleSkeleton).toHaveClass('h-4', 'w-3/4')

        // Price skeleton
        const priceSkeleton = skeletons[2]
        expect(priceSkeleton).toHaveClass('h-3', 'w-1/2')

        // Button skeletons
        const buttonSkeletons = skeletons.slice(3)
        expect(buttonSkeletons[0]).toHaveClass('h-9', 'flex-1')
        expect(buttonSkeletons[1]).toHaveClass('h-9', 'w-9')
    })

    it('has correct layout structure', () => {
        render(<ProductCardSkeleton />)

        const container = screen.getByTestId('skeleton').closest('[class*="space-y-4"]')
        expect(container).toBeInTheDocument()

        const buttonsContainer = container?.querySelector('[class*="flex gap-2"]')
        expect(buttonsContainer).toBeInTheDocument()
    })

    it('applies animation class', () => {
        render(<ProductCardSkeleton />)

        const skeletons = screen.getAllByTestId('skeleton')
        skeletons.forEach(skeleton => {
            expect(skeleton).toHaveClass('animate-pulse-slow')
        })
    })

    it('has rounded corners on image skeleton', () => {
        render(<ProductCardSkeleton />)

        const imageSkeleton = screen.getAllByTestId('skeleton')[0]
        expect(imageSkeleton).toHaveClass('rounded-xl')
    })

    it('has correct responsive design', () => {
        render(<ProductCardSkeleton />)

        // All skeletons should be full width on mobile
        const skeletons = screen.getAllByTestId('skeleton')
        skeletons.forEach(skeleton => {
            expect(skeleton).toHaveClass('w-full')
        })
    })
})