'use client'

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Product } from "./types"
import { WishlistButton } from "./WishlistButton"
import { ProductBadge } from "./ProductBadge"
import { AddToCartButton } from "./AddToCartButton"

interface Props {
    product: Product
}

export function ProductImage({ product }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [isTouchDevice] = useState(() => {
        if (typeof window === "undefined") return false

        return window.matchMedia('(hover: none) and (pointer: coarse)').matches
    })
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Ensure image is treated as an array even if it's somehow a string
    const images = Array.isArray(product.image) ? product.image : [product.image]
    const hasMultiple = images.length > 1

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0.5 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const article = containerRef.current?.closest('article.group')
        if (!article) return

        const handleMouseEnter = () => setIsHovered(true)
        const handleMouseLeave = () => {
            setIsHovered(false)
            setCurrentIndex(0)
            setIsPaused(false)
            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current)
                interactionTimeoutRef.current = null
            }
        }

        article.addEventListener('mouseenter', handleMouseEnter)
        article.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            article.removeEventListener('mouseenter', handleMouseEnter)
            article.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    useEffect(() => {
        const shouldPlay = hasMultiple && !isPaused && (isHovered || (isTouchDevice && isVisible))
        if (!shouldPlay) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length)
        }, 2500) // Change image every 1.5 seconds

        return () => clearInterval(timer)
    }, [hasMultiple, isHovered, isPaused, images.length, isTouchDevice, isVisible])

    const handleInteraction = () => {
        setIsPaused(true)
        if (interactionTimeoutRef.current) {
            clearTimeout(interactionTimeoutRef.current)
        }
        interactionTimeoutRef.current = setTimeout(() => {
            setIsPaused(false)
        }, 3000)
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
        handleInteraction()
    }

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
        handleInteraction()
    }

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        goToNext()
    }

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        goToPrev()
    }

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
        handleInteraction()
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return
        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > 50
        const isRightSwipe = distance < -50

        if (isLeftSwipe) {
            goToNext()
        } else if (isRightSwipe) {
            goToPrev()
        }
    }

    const showControls = isHovered || isTouchDevice

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden rounded-t-[10px] bg-[#F8F8F8]"
        >
            <ProductBadge discount={product.discount} inStock={product.inStock} />
            <WishlistButton product={product} />

            <div className="relative aspect-5/7 overflow-hidden">
                {/* Image Track */}
                <div
                    className="flex h-full w-full transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {images.map((src, idx) => (
                        <div key={idx} className="relative h-full w-full shrink-0 p-2">
                            <Image
                                src={src}
                                alt={`${product.title} - Image ${idx + 1}`}
                                fill
                                loading={idx === 0 ? "eager" : "lazy"}
                                priority={idx === 0}
                                className="object-contain transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    ))}
                </div>

                {/* Navigation Controls (Left/Right Arrows) */}
                {hasMultiple && (
                    <>
                        <button
                            onClick={prevImage}
                            className={`absolute cursor-pointer left-2 top-1/2 flex h-7 w-7 transform active:scale-95 duration-100 ease-out -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-matt-black-200 shadow-sm transition-all hover:bg-white hover:scale-110 z-10 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                                }`}
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={nextImage}
                            className={`absolute cursor-pointer right-2 top-1/2 flex h-7 w-7 transform active:scale-95 ease-out -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-matt-black-200 shadow-sm transition-all duration-100 hover:bg-white hover:scale-110 z-10 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                                }`}
                            aria-label="Next image"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </>
                )}

                {/* Bottom Indicators (Dots) */}
                {hasMultiple && (
                    <div className={`absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        }`}>
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                aria-label={`Go to slide ${idx + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentIndex
                                    ? "w-4 bg-sunflower-100"
                                    : "w-1.5 bg-neutral-300 hover:bg-neutral-400"
                                    }`}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setCurrentIndex(idx)
                                    handleInteraction()
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AddToCartButton product={product} />
        </div>
    )
}