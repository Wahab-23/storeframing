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
                duration-100
                hover:scale-110
                hover:bg-cadmium-red-200
                hover:text-white-chalk-100
                cursor-pointer
                hover:animate-pulse
                transform  active:scale-95 ease-out
            "
            onClick={() => console.log("Wishlist Button Clicked!")}
        >
            <Heart
                className={"h-4 w-4"}
            />
        </button>
    )
}