interface ProductBadgeProps {
    discount?: number
}

export function ProductBadge({
    discount,
}: ProductBadgeProps) {
    if (!discount) return null
    return (
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
            "
        >
            {discount}% Off
        </div>
    )
}