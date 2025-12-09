import { cn } from './cn'

describe('cn utility', () => {
    it('should merge class names correctly', () => {
        const result = cn('bg-red-500', 'text-white')
        expect(result).toBe('bg-red-500 text-white')
    })

    it('should handle conditional class names', () => {
        const isActive = true
        const isDisabled = false

        const result = cn(
            'base-class',
            isActive && 'active-class',
            isDisabled && 'disabled-class'
        )

        expect(result).toBe('base-class active-class')
    })

    it('should handle object notation', () => {
        const result = cn({
            'bg-red-500': true,
            'text-white': true,
            'p-4': false,
            'm-2': true,
        })

        expect(result).toBe('bg-red-500 text-white m-2')
    })

    it('should handle mixed arguments', () => {
        const result = cn(
            'base-class',
            {
                'conditional-class': true,
                'another-conditional': false,
            },
            'another-class'
        )

        expect(result).toBe('base-class conditional-class another-class')
    })

    it('should handle arrays of class names', () => {
        const result = cn([
            'class1',
            'class2',
            ['nested-class1', 'nested-class2'],
        ])

        expect(result).toBe('class1 class2 nested-class1 nested-class2')
    })

    it('should deduplicate Tailwind classes', () => {
        const result = cn('p-4', 'p-8', 'm-2', 'm-4')
        // tailwind-merge should keep the last conflicting class
        expect(result).toBe('p-8 m-4')
    })

    it('should handle undefined and null values', () => {
        const result = cn('class1', undefined, 'class2', null, 'class3')
        expect(result).toBe('class1 class2 class3')
    })

    it('should handle empty strings', () => {
        const result = cn('class1', '', 'class2')
        expect(result).toBe('class1 class2')
    })

    it('should handle complex nested structures', () => {
        const isPrimary = true
        const isLarge = false

        const result = cn(
            'btn',
            {
                'btn-primary': isPrimary,
                'btn-secondary': !isPrimary,
                'btn-lg': isLarge,
                'btn-sm': !isLarge,
            },
            ['additional-class1', 'additional-class2'],
            'final-class'
        )

        expect(result).toBe('btn btn-primary btn-sm additional-class1 additional-class2 final-class')
    })

    it('should preserve non-Tailwind class duplicates', () => {
        const result = cn('custom-class', 'another-custom-class', 'custom-class')
        expect(result).toBe('custom-class another-custom-class custom-class')
    })

    it('should handle Tailwind responsive prefixes correctly', () => {
        const result = cn('p-4', 'md:p-8', 'lg:p-12')
        expect(result).toBe('p-4 md:p-8 lg:p-12')
    })

    it('should merge conflicting responsive classes', () => {
        const result = cn('p-4', 'md:p-8', 'md:p-12', 'lg:p-16')
        expect(result).toBe('p-4 md:p-12 lg:p-16')
    })

    it('should handle pseudo-class variants', () => {
        const result = cn('hover:bg-blue-500', 'focus:bg-blue-700', 'active:bg-blue-800')
        expect(result).toBe('hover:bg-blue-500 focus:bg-blue-700 active:bg-blue-800')
    })

    it('should merge conflicting pseudo-class variants', () => {
        const result = cn('hover:bg-blue-500', 'hover:bg-blue-700')
        expect(result).toBe('hover:bg-blue-700')
    })

    it('should handle dark mode classes', () => {
        const result = cn('bg-white', 'dark:bg-gray-900', 'text-gray-900', 'dark:text-white')
        expect(result).toBe('bg-white dark:bg-gray-900 text-gray-900 dark:text-white')
    })

    it('should return empty string for all falsy values', () => {
        const result = cn(undefined, null, false, '', {})
        expect(result).toBe('')
    })

    it('should handle function calls that return class names', () => {
        const getSizeClass = (size: string) => {
            switch(size) {
                case 'sm': return 'text-sm p-2'
                case 'lg': return 'text-lg p-4'
                default: return 'text-base p-3'
            }
        }

        const result = cn('base-class', getSizeClass('lg'), 'mt-4')
        expect(result).toBe('base-class text-lg p-4 mt-4')
    })
})