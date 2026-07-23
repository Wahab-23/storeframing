'use client'

import { Heart } from "lucide-react"
import { useWishlist } from "@/lib/wishlist/WishlistContext"
import { Product } from "./types"

interface WishlistButtonProps {
    product?: Product
}

export function WishlistButton({ product }: WishlistButtonProps) {
    const { toggleItem, isWishlisted } = useWishlist()

    const wishlisted = product ? isWishlisted(product.id) : false

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (product) {
            toggleItem(product)
        }
    }

    return (
        <button
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            onClick={handleClick}
            className={`
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
                cursor-pointer
                backdrop-blur
                transition-all
                duration-200
                hover:scale-110
                transform active:scale-95 ease-out
                ${wishlisted
                    ? "border-cadmium-red-100 bg-cadmium-red-100 text-white shadow-md ring-2 ring-cadmium-red-100/30"
                    : "border-neutral-200 bg-white/95 text-matt-black-300 hover:border-cadmium-red-200 hover:bg-cadmium-red-500/40 hover:text-cadmium-red-100"
                }
            `}
        >
            <Heart
                className={`h-4 w-4 transition-all duration-200 ${wishlisted
                        ? "fill-white stroke-white scale-105 stroke-2"
                        : "fill-transparent stroke-current"
                    }`}
            />
        </button>
    )
}