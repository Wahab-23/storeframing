"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeaderNavCategory } from "./types";

interface NavigationBarProps {
    navigation: HeaderNavCategory[];

    activeCategory: number | null;

    setActiveCategory: React.Dispatch<
        React.SetStateAction<number | null>
    >;

    setActiveSubcategory: React.Dispatch<
        React.SetStateAction<number>
    >;

    scheduleClose: () => void;

    clearCloseTimer: () => void;
}

export function NavigationBar({
    navigation,
    activeCategory,
    setActiveCategory,
    setActiveSubcategory,
    scheduleClose,
    clearCloseTimer,
}: NavigationBarProps) {
    const scrollContainerRef =
        useRef<HTMLDivElement>(null);

    const [canScrollLeft, setCanScrollLeft] =
        useState(false);

    const [canScrollRight, setCanScrollRight] =
        useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollContainerRef.current;

        if (!el) return;

        const {
            scrollLeft,
            scrollWidth,
            clientWidth,
        } = el;

        setCanScrollLeft(scrollLeft > 0);

        setCanScrollRight(
            Math.ceil(scrollLeft + clientWidth) <
            scrollWidth
        );
    }, []);

    useEffect(() => {
        checkScroll();

        window.addEventListener(
            "resize",
            checkScroll
        );

        return () =>
            window.removeEventListener(
                "resize",
                checkScroll
            );
    }, [checkScroll]);

    const scrollLeft = () => {
        scrollContainerRef.current?.scrollBy({
            left: -250,
            behavior: "smooth",
        });
    };

    const scrollRight = () => {
        scrollContainerRef.current?.scrollBy({
            left: 250,
            behavior: "smooth",
        });
    };

    const handleCategoryEnter = (
        index: number
    ) => {
        clearCloseTimer();

        setActiveCategory(index);

        setActiveSubcategory(0);
    };

    return (
        <nav className="bg-white-chalk-500 border-b border-matt-black-300/20">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative">

                    {/* LEFT BUTTON */}

                    {canScrollLeft && (
                        <button
                            onClick={scrollLeft}
                            className="absolute left-0 top-0 bottom-0 z-10 flex w-12 items-center justify-start bg-linear-to-r from-white-chalk-500 via-white-chalk-500/90 to-transparent text-matt-black-100 hover:text-sunflower-100"
                        >
                            <ChevronLeft className="ml-1 h-5 w-5" />
                        </button>
                    )}

                    {/* SCROLLER */}

                    <div
                        ref={scrollContainerRef}
                        onScroll={checkScroll}
                        className="flex h-11 items-center overflow-x-auto scrollbar-hide"
                    >
                        {navigation.map((category, index) => (
                            <Link
                                key={category.label}
                                href={category.href}
                                onMouseEnter={() =>
                                    handleCategoryEnter(index)
                                }
                                onMouseLeave={scheduleClose}
                                className={`relative flex h-full shrink-0 items-center whitespace-nowrap px-4 text-[13px] font-semibold tracking-wide transition-colors duration-200 ${activeCategory === index
                                    ? "text-sunflower-100"
                                    : "text-matt-black-100 hover:text-sunflower-100"
                                    }`}
                            >
                                {category.label}

                                {activeCategory === index && (
                                    <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-sunflower-100" />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* RIGHT BUTTON */}

                    {canScrollRight && (
                        <button
                            onClick={scrollRight}
                            className="absolute right-0 top-0 bottom-0 z-10 flex w-12 items-center justify-end bg-linear-to-l from-white-chalk-500 via-white-chalk-500/90 to-transparent text-matt-black-100 hover:text-sunflower-100"
                        >
                            <ChevronRight className="mr-1 h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}