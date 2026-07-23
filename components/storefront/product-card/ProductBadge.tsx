interface ProductBadgeProps {
    discount?: number
    inStock?: boolean
}

export function ProductBadge({
    discount,
    inStock = true,
}: ProductBadgeProps) {
    return (
        <>
            {discount && (
                <div
                    className="
                        absolute
                        left-2
                        top-2
                        z-20
                        rounded-sm
                        bg-sunflower-200
                        px-2
                        py-1
                        text-[10px]
                        font-bold
                        leading-none
                        text-matt-black-100
                        shadow-2xs
                    "
                >
                    {discount}% Off
                </div>
            )}
            {inStock === false && (
                <div
                    className="
                        absolute
                        left-2
                        bottom-2
                        z-20
                        rounded-sm
                        bg-cadmium-red-100
                        px-2
                        py-1
                        text-[10px]
                        font-bold
                        leading-none
                        text-white
                        shadow-xs
                    "
                >
                    Out of Stock
                </div>
            )}
        </>
    )
}