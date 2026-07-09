interface Props {
    price: number;
}

export function ProductPrice({ price }: Props) {
    return (
        <div className="mt-1">
            <h4 className="text-lg font-extrabold leading-none text-matt-black-100 mt-2 mb-2">
                Rs: {price.toLocaleString()}
            </h4>
        </div>
    )
}