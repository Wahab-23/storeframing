import Image from "next/image";
import { User, Heart, ShoppingCart } from "lucide-react";

import { HeaderData, HeaderActionLink } from "./types";
import { defaultHeaderData } from "./defaultData";
import { SearchBar } from "./SearchBar";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";

// ─── Action icon map ──────────────────────────────────────────────────────────

function ActionIcon({ icon }: { icon: HeaderActionLink["icon"] }) {
    const cls = "w-5 h-5 stroke-[1.8]";
    if (icon === "user") return <User className={cls} />;
    if (icon === "heart") return <Heart className={cls} />;
    return <ShoppingCart className={cls} />;
}

// ─── Main Server Component ────────────────────────────────────────────────────

interface HeaderProps {
    /** Pass fetched DB data here; falls back to static defaults if omitted. */
    data?: Partial<HeaderData>;
}

export default function Header({ data }: HeaderProps) {
    const d: HeaderData = { ...defaultHeaderData, ...data };

    return (
        <header className="sticky top-0 z-100 w-full font-sans selection:bg-sunflower-100 selection:text-matt-black-100">
            {/* ── Row 1: Top Bar ── */}
            <div className="bg-matt-black-100 border-b border-matt-black-200/60">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-14 gap-4 lg:gap-8">
                        {/* Mobile hamburger */}
                        <MobileMenu navigation={d.navigation} actions={d.actions} />

                        {/* Logo */}
                        <a href="/" className="flex items-center shrink-0">
                            <Image
                                src={d.logo.src}
                                alt={d.logo.alt}
                                width={d.logo.width ?? 140}
                                height={d.logo.height ?? 40}
                                className="object-contain h-auto w-auto max-h-[32px] lg:max-h-[36px] hover:opacity-90 transition-opacity duration-200"
                                priority
                            />
                        </a>

                        {/* Search bar — hidden on mobile, shown on desktop */}
                        <div className="hidden lg:flex flex-1 justify-center">
                            <SearchBar />
                        </div>

                        {/* Action icons */}
                        <div className="hidden lg:flex items-center gap-1 ml-auto">
                            {d.actions.map((action) => (
                                <a
                                    key={action.label}
                                    href={action.href}
                                    className="group relative flex items-center gap-2 px-3 py-2 rounded-lg text-white-chalk-400 hover:text-sunflower-100 hover:bg-matt-black-200/60 transition-all duration-200"
                                >
                                    <div className="relative">
                                        <ActionIcon icon={action.icon} />
                                        {/* Badge for cart count */}
                                        {action.badge != null && action.badge > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-sunflower-100 text-matt-black-100 text-[10px] font-extrabold leading-none">
                                                {action.badge > 99 ? "99+" : action.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium hidden xl:inline">
                                        {action.label}
                                    </span>
                                </a>
                            ))}
                        </div>

                        {/* Mobile: compact action icons (just cart & wishlist) */}
                        <div className="flex lg:hidden items-center gap-0.5 ml-auto">
                            {d.actions
                                .filter((a) => a.icon !== "user")
                                .map((action) => (
                                    <a
                                        key={action.label}
                                        href={action.href}
                                        className="relative flex items-center justify-center w-10 h-10 rounded-lg text-white-chalk-400 hover:text-sunflower-100 transition-colors duration-200"
                                    >
                                        <ActionIcon icon={action.icon} />
                                        {action.badge != null && action.badge > 0 && (
                                            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-sunflower-100 text-matt-black-100 text-[9px] font-extrabold leading-none">
                                                {action.badge > 99 ? "99+" : action.badge}
                                            </span>
                                        )}
                                    </a>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Row 2: Navigation + Megamenu (Desktop only) ── */}
            <div className="hidden lg:block relative">
                <MegaMenu navigation={d.navigation} />
            </div>

            {/* ── Mobile: Search bar below top bar ── */}
            <div className="lg:hidden bg-matt-black-100 border-b border-matt-black-200/40 px-4 py-2">
                <SearchBar placeholder="Search..." />
            </div>
        </header>
    );
}