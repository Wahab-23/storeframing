'use client'

import { Heart } from "lucide-react"

interface WishlistButtonProps {
    active?: boolean
}

export function WishlistButton({
    active = false,
}: WishlistButtonProps) {
    return (
        <button
            aria-label="Add to wishlist"
            className="
                absolute
                right-2
                top-2
                z-20
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                border
                border-neutral-200
                bg-white/95
                backdrop-blur
                transition-all
                duration-200
                hover:scale-110
                hover:bg-cadmium-red-200
                hover:text-white-chalk-100
                cursor-pointer
                hover:animate-pulse
            "
        >
            <Heart
                className={"h-4 w-4"}
            />
        </button>
    )
}