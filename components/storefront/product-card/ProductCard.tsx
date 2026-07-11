import { Product } from "./types"

import { ProductImage } from "./ProductImage"
import { ProductTitle } from "./ProductTitle"
import { ProductPrice } from "./ProductPrice"
import { Seller } from "./Seller"
import { Tags } from "./Tags"

interface Props {
    product: Product
}

export function ProductCard({ product }: Props) {

    return (
        <article
            className="
            group
            w-[210px]
            min-w-[160px]
            overflow-hidden
            rounded-[10px]
            border
            border-matt-black-500
            bg-white-chalk-100
            shadow-[0_2px_8px_rgba(0,0,0,.04)]
            transition-all
            duration-200
            hover:-translate-y-1
            hover:shadow-lg
            "
        >
            <ProductImage product={product} />
            <div className="px-2 pb-2">
                <Seller seller={product.seller} />
                <ProductTitle>
                    {product.title}
                </ProductTitle>
                <ProductPrice
                    price={product.price}
                />
                <Tags
                    oldPrice={product.oldPrice}
                    inStock={product.inStock}
                    estDelivery={product.estDelivery}
                    rating={product.rating}
                    reviews={product.reviews}
                />
            </div>
        </article>
    )
}