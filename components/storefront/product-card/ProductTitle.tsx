import { ReactNode } from "react"

interface Props {
    children: ReactNode
}

export function ProductTitle({
    children
}: Props) {
    return (
        <h4
            className="
            mt-1
            text-md
            leading-5
            line-clamp-2
            font-bold
            text-matt-black-200
            "
        >
            {children}
        </h4>
    )
}