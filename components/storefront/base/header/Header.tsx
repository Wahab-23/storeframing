"use client";

import Image from "next/image";
import { User, Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";

import { HeaderData, HeaderActionLink } from "./types";
import { defaultHeaderData } from "./defaultData";
import { SearchBar } from "./SearchBar";
import MegaMenu from "./mega-menu/MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { useCart } from "@/lib/cart/CartContext";
import { useWishlist } from "@/lib/wishlist/WishlistContext";

// ─── Action icon map ──────────────────────────────────────────────────────────

function ActionIcon({ icon }: { icon: HeaderActionLink["icon"] }) {
    const cls = "w-5 h-5 stroke-[1.8]";
    if (icon === "user") return <User className={cls} />;
    if (icon === "heart") return <Heart className={cls} />;
    return <ShoppingCart className={cls} />;
}

// ─── Main Client Component ────────────────────────────────────────────────────

interface HeaderProps {
    /** Pass fetched DB data here; falls back to static defaults if omitted. */
    data?: Partial<HeaderData>;
}

export default function Header({ data }: HeaderProps) {
    const d: HeaderData = { ...defaultHeaderData, ...data };
    const { toggleCart, totalItems } = useCart();
    const { toggleWishlist, totalItems: wishlistCount } = useWishlist();

    return (
        <header className="contents">
            {/* ── Row 1: Top Bar (Sticky) ── */}
            <div className="sticky top-0 z-101 w-full bg-white border-b border-gray-200 font-sans selection:bg-sunflower-100 selection:text-matt-black-100 shadow-sm">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14 gap-4 lg:gap-8">
                        {/* Mobile hamburger */}
                        <MobileMenu navigation={d.navigation} actions={d.actions} />

                        {/* Logo */}
                        <Link href="/" className="flex items-center shrink-0">
                            {/* Desktop Logo */}
                            <Image
                                src={d.logo.src}
                                alt={d.logo.alt}
                                width={d.logo.width ?? 140}
                                height={d.logo.height ?? 40}
                                className="hidden lg:block object-contain h-auto w-auto max-h-8 lg:max-h-9 hover:opacity-90 transition-opacity duration-200"
                                priority
                            />
                            {/* Mobile Logo */}
                            <Image
                                src="/company-identity/Insignia.svg"
                                alt={d.logo.alt}
                                width={32}
                                height={32}
                                className="block lg:hidden object-contain h-auto w-auto max-h-7 hover:opacity-90 transition-opacity duration-200"
                                priority
                            />
                        </Link>

                        {/* Search bar */}
                        <div className="flex flex-1 justify-center mx-2 lg:mx-0 lg:ml-4">
                            <SearchBar />
                        </div>

                        {/* Action icons */}
                        <div className="hidden lg:flex items-center gap-1 ml-auto">
                            {d.actions.map((action) => {
                                const isCart = action.icon === "shopping-cart";
                                const isWishlist = action.icon === "heart";
                                const badgeCount = isCart
                                    ? totalItems
                                    : isWishlist
                                        ? wishlistCount
                                        : action.badge;

                                if (isCart || isWishlist) {
                                    return (
                                        <button
                                            key={action.label}
                                            onClick={isCart ? toggleCart : toggleWishlist}
                                            type="button"
                                            className="group relative flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-black hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                                        >
                                            <div className="relative">
                                                <ActionIcon icon={action.icon} />
                                                {badgeCount != null && badgeCount > 0 && (
                                                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-sunflower-100 text-matt-black-100 text-[10px] font-extrabold leading-none">
                                                        {badgeCount > 99 ? "99+" : badgeCount}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium hidden xl:inline">
                                                {action.label}
                                            </span>
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="group relative flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-black hover:bg-gray-100 transition-all duration-200"
                                    >
                                        <div className="relative">
                                            <ActionIcon icon={action.icon} />
                                            {badgeCount != null && badgeCount > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-sunflower-100 text-matt-black-100 text-[10px] font-extrabold leading-none">
                                                    {badgeCount > 99 ? "99+" : badgeCount}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm font-medium hidden xl:inline">
                                            {action.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile: compact action icons (just cart) */}
                        <div className="flex lg:hidden items-center gap-0.5">
                            {d.actions
                                .filter((a) => a.icon === "shopping-cart")
                                .map((action) => (
                                    <button
                                        key={action.label}
                                        onClick={toggleCart}
                                        type="button"
                                        className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:text-black hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                                    >
                                        <ActionIcon icon={action.icon} />
                                        {totalItems > 0 && (
                                            <span className="absolute top-1 right-1 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 rounded-full bg-sunflower-100 text-matt-black-100 text-[9px] font-extrabold leading-none">
                                                {totalItems > 99 ? "99+" : totalItems}
                                            </span>
                                        )}
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Row 2: Navigation + Megamenu (Desktop only) - Scrolls naturally ── */}
            <div className="hidden lg:block relative z-100 w-full font-sans">
                <MegaMenu navigation={d.navigation} />
            </div>
        </header>
    );
}