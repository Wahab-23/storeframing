'use client'

import { Plus, Ban } from "lucide-react"
import { useCart } from "@/components/storefront/base/cart/CartContext"
import { Product } from "./types"

interface AddToCartButtonProps {
    product?: Product
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
    const { cart, addToCart } = useCart()

    const outOfStock = product?.inStock === false
    const itemInCart = product && !outOfStock
        ? cart.find((item) => item.product.id === product.id)
        : null
    const quantity = itemInCart ? itemInCart.quantity : 0
    const isAdded = quantity > 0

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (product && !outOfStock) {
            addToCart(product)
        }
    }

    if (outOfStock) {
        return (
            <div
                aria-label="Out of stock"
                title="Out of stock — cannot add to cart"
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
                    rounded-lg
                    border
                    border-neutral-200
                    bg-neutral-100
                    text-neutral-400
                    shadow-sm
                    cursor-not-allowed
                    select-none
                "
            >
                <Ban className="h-4 w-4 stroke-2" />
            </div>
        )
    }

    return (
        <button
            onClick={handleClick}
            aria-label={isAdded ? `${quantity} in cart. Click to add more and view cart.` : "Add to cart"}
            title={isAdded ? `${quantity} in cart — click to add more & open side cart` : "Add to cart"}
            className={`
                absolute
                bottom-2
                right-2
                z-20
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                border
                cursor-pointer
                transition-all
                duration-200
                hover:scale-105
                transform active:scale-95 ease-out
                ${isAdded
                    ? "border-sunflower-100 bg-sunflower-100 text-matt-black-100 font-extrabold"
                    : "border-neutral-300 bg-white text-matt-black-100 hover:border-black hover:bg-black hover:text-white"
                }
            `}
        >
            {isAdded ? (
                <span className="text-xs font-extrabold tracking-tight text-matt-black-100">
                    {quantity}
                </span>
            ) : (
                <Plus className="h-4 w-4 stroke-[2.5]" />
            )}
        </button>
    )
}