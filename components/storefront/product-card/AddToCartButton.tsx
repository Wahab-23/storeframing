'use client'

import { Plus } from "lucide-react"

export function AddToCartButton() {
    return (
        <button
            aria-label="Add to cart"
            className="
                absolute
                bottom-2
                right-2
                z-20
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-md
                border
                cursor-pointer
                border-neutral-300
                bg-white
                shadow-sm
                transition-all
                duration-200
                hover:scale-105
                hover:border-black
                hover:bg-black
                hover:text-white
            "
        >
            <Plus className="h-5 w-5" />
        </button>
    )
}