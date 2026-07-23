import React from 'react'

interface Props {
    oldPrice?: number
    inStock?: boolean
    estDelivery?: string
    rating?: number
    reviews?: number
}

const ROW_H = 1.5 // rem
const ROW_H_STR = `${ROW_H}rem`
const HOLD_MS = 3500  // how long each tag stays visible
const SLIDE_MS = 400  // slide in / slide out duration

const OldPriceRow = ({ value }: { value: number }) => {
    return (
        <div className="flex items-center gap-1 text-[11px] flex-none" style={{ height: ROW_H_STR }}>
            <span className="flex items-center justify-center rounded bg-sunflower-200 w-4.5 h-4.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.91659 2.08337L2.08325 7.91671" stroke="#3E3C3C" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.70841 3.74996C3.28371 3.74996 3.75008 3.28359 3.75008 2.70829C3.75008 2.133 3.28371 1.66663 2.70841 1.66663C2.13312 1.66663 1.66675 2.133 1.66675 2.70829C1.66675 3.28359 2.13312 3.74996 2.70841 3.74996Z" stroke="#3E3C3C" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7.29167 8.33333C7.86696 8.33333 8.33333 7.86696 8.33333 7.29167C8.33333 6.71637 7.86696 6.25 7.29167 6.25C6.71637 6.25 6.25 6.71637 6.25 7.29167C6.25 7.86696 6.71637 8.33333 7.29167 8.33333Z" stroke="#3E3C3C" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            <span className="text-neutral-500">Was</span>
            <span className="font-semibold text-cadmium-red-200 line-through">
                Rs:{value.toLocaleString()}
            </span>
        </div>
    )
}

const DeliveryRow = ({ label }: { label?: string }) => {
    return (
        <div className="flex items-center gap-1 text-[11px] flex-none" style={{ height: ROW_H_STR }}>
            <span className="flex items-center justify-center rounded bg-sunflower-200 w-4.5 h-4.5">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.714286 3.42857H5V4H0.714286V3.42857ZM0 2H3.57143V2.57143H0V2Z" fill="#3E3C3C" />
                    <path d="M9.97086 3.85635L8.8915 1.31115C8.86377 1.24575 8.81766 1.19002 8.75888 1.15086C8.70011 1.11169 8.63126 1.09081 8.56086 1.0908H7.48151V0.363601C7.48151 0.267168 7.4436 0.174685 7.37613 0.106496C7.30866 0.0383079 7.21715 0 7.12173 0H1.36518V0.727202H6.76194V5.29258C6.5981 5.38891 6.4547 5.51701 6.33998 5.66951C6.22526 5.82201 6.14149 5.99591 6.09346 6.18122H3.83258C3.74501 5.83847 3.53675 5.53976 3.24684 5.34108C2.95694 5.14241 2.60528 5.0574 2.2578 5.10201C1.91032 5.14661 1.59086 5.31776 1.3593 5.58338C1.12775 5.84899 1 6.19083 1 6.54482C1 6.89881 1.12775 7.24065 1.3593 7.50627C1.59086 7.77188 1.91032 7.94303 2.2578 7.98763C2.60528 8.03224 2.95694 7.94724 3.24684 7.74856C3.53675 7.54988 3.74501 7.25117 3.83258 6.90842H6.09346C6.17173 7.22048 6.35072 7.49725 6.60212 7.69495C6.85351 7.89266 7.16296 8 7.48151 8C7.80005 8 8.1095 7.89266 8.3609 7.69495C8.6123 7.49725 8.79129 7.22048 8.86956 6.90842H9.64022C9.73564 6.90842 9.82715 6.87012 9.89462 6.80193C9.96209 6.73374 10 6.64125 10 6.54482V3.99961C9.99999 3.95036 9.99007 3.90162 9.97086 3.85635ZM2.44453 7.27202C2.30221 7.27202 2.16309 7.22937 2.04476 7.14947C1.92642 7.06956 1.8342 6.95599 1.77973 6.82311C1.72527 6.69023 1.71102 6.54401 1.73879 6.40295C1.76655 6.26189 1.83508 6.13231 1.93572 6.03061C2.03635 5.92891 2.16456 5.85965 2.30415 5.83159C2.44373 5.80353 2.58841 5.81793 2.7199 5.87297C2.85138 5.92801 2.96376 6.02122 3.04283 6.14081C3.12189 6.2604 3.1641 6.40099 3.1641 6.54482C3.1641 6.73769 3.08829 6.92265 2.95334 7.05903C2.81839 7.19541 2.63537 7.27202 2.44453 7.27202ZM7.48151 1.81801H8.32341L9.09478 3.63601H7.48151V1.81801ZM7.48151 7.27202C7.33919 7.27202 7.20007 7.22937 7.08174 7.14947C6.96341 7.06956 6.87118 6.95599 6.81671 6.82311C6.76225 6.69023 6.748 6.54401 6.77577 6.40295C6.80353 6.26189 6.87206 6.13231 6.9727 6.03061C7.07333 5.92891 7.20155 5.85965 7.34113 5.83159C7.48071 5.80353 7.62539 5.81793 7.75688 5.87297C7.88836 5.92801 8.00074 6.02122 8.07981 6.14081C8.15888 6.2604 8.20108 6.40099 8.20108 6.54482C8.20108 6.73769 8.12527 6.92265 7.99032 7.05903C7.85538 7.19541 7.67235 7.27202 7.48151 7.27202ZM9.28043 6.18122H8.86956C8.79031 5.86977 8.61103 5.59371 8.35983 5.3963C8.10863 5.19889 7.79972 5.09131 7.48151 5.09042V4.36321H9.28043V6.18122Z" fill="#3E3C3C" />
                </svg>
            </span>
            <span className="font-medium text-matt-black-200">{label}</span>
        </div>
    )
}

const RatingCount = ({ rating, reviews }: { rating?: number, reviews?: number }) => {
    return (
        <div className="flex items-center gap-1 text-[11px] flex-none" style={{ height: ROW_H_STR }}>
            <span className="flex items-center justify-center rounded w-4.5 h-4.5 bg-sunflower-200">
                <svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.08333 0.25L7.88583 3.90167L11.9167 4.49083L9 7.33167L9.68833 11.345L6.08333 9.44917L2.47833 11.345L3.16667 7.33167L0.25 4.49083L4.28083 3.90167L6.08333 0.25Z" fill="#3E3C3C" stroke="#3E3C3C" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            <span className="font-medium text-matt-black-200">
                {/* <span>Rated: </span> */}
                <span className='font-bold text-pablano-200'>{rating}</span>
                <span> by </span>
                <span className='font-bold text-pablano-200'>{reviews}</span>
                <span> customers</span>
            </span>
        </div>
    )
}

export function Tags({ oldPrice, inStock, estDelivery, rating, reviews }: Props) {
    // Build ordered tag list: oldPrice first, then delivery, add more here as needed
    const tags: React.ReactNode[] = []
    if (oldPrice) tags.push(<OldPriceRow key="price" value={oldPrice} />)
    if (inStock) tags.push(<DeliveryRow key="delivery" label={estDelivery} />)
    if (rating) tags.push(<RatingCount key="rating" rating={rating} reviews={reviews} />)

    const n = tags.length
    if (n === 0) return null

    if (n === 1) {
        return (
            <div className="mt-2 overflow-hidden bg-white-chalk-500 rounded px-1" style={{ height: ROW_H_STR }}>
                <style>{`
                    @keyframes tag-slide-in {
                        from { transform: translateY(120%); }
                        to { transform: translateY(0%); }
                    }
                `}</style>
                <div style={{ animation: `tag-slide-in ${SLIDE_MS}ms ease-out both` }}>
                    {tags[0]}
                </div>
            </div>
        )
    }

    const totalMs = (HOLD_MS + SLIDE_MS) * n
    const animationName = `tag-ticker-${n}`

    let keyframes = `@keyframes ${animationName} {\n`
    for (let i = 0; i < n; i++) {
        const holdStart = (i * (HOLD_MS + SLIDE_MS)) / totalMs * 100
        const holdEnd = ((i * (HOLD_MS + SLIDE_MS)) + HOLD_MS) / totalMs * 100
        keyframes += `  ${holdStart.toFixed(2)}%, ${holdEnd.toFixed(2)}% { transform: translateY(-${i * ROW_H}rem); }\n`
    }
    keyframes += `  100% { transform: translateY(-${n * ROW_H}rem); }\n}`

    const clonedFirst = React.isValidElement(tags[0])
        ? React.cloneElement(tags[0], { key: 'clone-0' } as React.Attributes)
        : tags[0]

    return (
        <div className="mt-2 overflow-hidden bg-white-chalk-500 rounded px-1" style={{ height: ROW_H_STR }}>
            <style>{keyframes}</style>
            <div
                className="flex flex-col"
                style={{
                    animation: `${animationName} ${totalMs}ms ease-in-out infinite`
                }}
            >
                {tags}
                {clonedFirst}
            </div>
        </div>
    )
}