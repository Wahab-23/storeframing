// ─── Brand shown in megamenu ──────────────────────────────────────────────────

export interface HeaderBrand {
    name: string;
    logo: string;
    href: string;
}

// ─── Deepest leaf link ────────────────────────────────────────────────────────

export interface HeaderNavLink {
    label: string;
    href: string;
}

// ─── Subcategory (column in the megamenu) ─────────────────────────────────────

export interface HeaderSubcategory {
    label: string;
    href: string;
    links: HeaderNavLink[];
}

// ─── Top-level nav category (triggers megamenu) ──────────────────────────────

export interface HeaderNavCategory {
    label: string;
    href: string;
    subcategories: HeaderSubcategory[];
    brands?: HeaderBrand[];
}

// ─── Logo config ──────────────────────────────────────────────────────────────

export interface HeaderLogoConfig {
    src: string;
    alt: string;
    width?: number;
    height?: number;
}

// ─── Top-bar action link (Sign In, Wishlist, Cart) ────────────────────────────

export interface HeaderActionLink {
    icon: "user" | "heart" | "shopping-cart";
    label: string;
    href: string;
    badge?: number;
}

// ─── Full header data ─────────────────────────────────────────────────────────

export interface HeaderData {
    logo: HeaderLogoConfig;
    actions: HeaderActionLink[];
    navigation: HeaderNavCategory[];
}
