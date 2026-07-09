export interface Product {
    id: string

    slug: string

    title: string

    seller: string

    image: string[]

    tags: string[]

    price: number

    oldPrice?: number

    discount?: number

    rating?: number

    reviews?: number

    inStock?: boolean

    stock?: number

    isWishlisted?: boolean

    estDelivery?: string
}