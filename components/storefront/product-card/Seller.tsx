interface Props {
    seller: string
}

export function Seller({ seller }: Props) {

    return (
        <p className="mt-1 text-[11px] leading-none">
            <span className="text-matt-black-400 font-semibold mr-0.5">
                Sold by:
            </span>
            <span className="font-semibold text-pablano-200">
                {seller}
            </span>
        </p>
    )
}