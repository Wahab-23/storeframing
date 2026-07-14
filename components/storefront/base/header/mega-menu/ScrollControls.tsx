"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollControlsProps {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    onScrollLeft: () => void;
    onScrollRight: () => void;
}

export function ScrollControls({
    canScrollLeft,
    canScrollRight,
    onScrollLeft,
    onScrollRight,
}: ScrollControlsProps) {
    return (
        <>
            {canScrollLeft && (
                <button
                    onClick={onScrollLeft}
                    className="absolute left-0 top-0 bottom-0 z-10 flex w-12 items-center justify-start bg-linear-to-r from-matt-black-200 via-matt-black-200/90 to-transparent text-white-chalk-100 hover:text-sunflower-100"
                >
                    <ChevronLeft className="ml-1 h-5 w-5" />
                </button>
            )}

            {canScrollRight && (
                <button
                    onClick={onScrollRight}
                    className="absolute right-0 top-0 bottom-0 z-10 flex w-12 items-center justify-end bg-linear-to-l from-matt-black-200 via-matt-black-200/90 to-transparent text-white-chalk-100 hover:text-sunflower-100"
                >
                    <ChevronRight className="mr-1 h-5 w-5" />
                </button>
            )}
        </>
    );
}