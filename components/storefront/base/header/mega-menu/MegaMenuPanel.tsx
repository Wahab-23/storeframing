"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HeaderNavCategory } from "./types";

interface MegaMenuPanelProps {
    category: HeaderNavCategory;
    activeSubcategory: number;
    setActiveSubcategory: React.Dispatch<React.SetStateAction<number>>;
    scheduleClose: () => void;
    clearCloseTimer: () => void;
}

export function MegaMenuPanel({
    category,
    activeSubcategory,
    setActiveSubcategory,
    scheduleClose,
    clearCloseTimer,
}: MegaMenuPanelProps) {
    const activeSub = category.subcategories[activeSubcategory];

    return (
        <div
            className="absolute left-0 right-0 z-50 border-b border-white-chalk-400 bg-white-chalk-100 shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
        >
            <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex min-h-[320px]">

                    {/* Left Side */}
                    <div className="w-[240px] shrink-0 border-r border-matt-black-500/50 pr-2">
                        {category.subcategories.map((subcategory, index) => (
                            <Link
                                key={subcategory.label}
                                href={subcategory.href}
                                onMouseEnter={() => setActiveSubcategory(index)}
                                className={`group flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${activeSubcategory === index
                                        ? "border-l border-sunflower-100 font-semibold text-matt-black-100"
                                        : "font-medium text-matt-black-300 hover:bg-white-chalk-200 hover:text-matt-black-100"
                                    }`}
                            >
                                <span>{subcategory.label}</span>

                                <ChevronRight
                                    className={`h-3.5 w-3.5 transition-all duration-150 ${activeSubcategory === index
                                            ? "translate-x-0 opacity-100"
                                            : "-translate-x-1 opacity-0"
                                        }`}
                                />
                            </Link>
                        ))}
                    </div>

                    {/* Right Side */}
                    <div className="flex-1 pl-8">

                        <h3 className="mb-4 border-b border-matt-black-500/30 pb-2 text-base font-bold text-matt-black-100">
                            {activeSub?.label}
                        </h3>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 xl:grid-cols-3">
                            {activeSub?.links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="group flex items-center gap-2 py-1.5 text-sm text-matt-black-300 transition-all hover:font-medium hover:text-matt-black-100"
                                >
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-matt-black-500/40 transition-colors group-hover:bg-sunflower-100" />

                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {!!category.brands?.length && (
                            <div className="mt-8 border-t border-matt-black-500/30 pt-5">

                                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-matt-black-400">
                                    Top Brands
                                </h4>

                                <div className="flex flex-wrap gap-4">
                                    {category.brands.map((brand) => (
                                        <Link
                                            key={brand.name}
                                            href={brand.href}
                                            title={brand.name}
                                            className="flex items-center justify-center rounded-lg border border-matt-black-500/50 bg-white-chalk-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-matt-black-300 transition-all hover:border-sunflower-100/30 hover:text-matt-black-100 hover:shadow-sm"
                                        >
                                            {brand.name}
                                        </Link>
                                    ))}
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}