"use me";
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    UserCheck,
    ShoppingCart,
    Wallet,
    Megaphone,
    FileText,
    Headphones,
    BarChart3,
    Shield,
    ChevronDown,
    ChevronRight,
    LogOut,
    Sparkles,
    Search,
    Menu,
    X,
    Building2,
    Tag,
    Layers,
    ListFilter,
    PackageCheck,
    Boxes,
    FileCheck2,
    BadgePercent,
    Sliders,
    HelpCircle,
    Compass,
    Globe,
    Image,
    MessageSquare,
    Ticket,
    AlertTriangle,
    FileSpreadsheet,
    UserPlus,
    KeyRound,
    Bell,
    Settings,
    Unplug,
    History,
    TrendingUp,
    FolderKanban,
    CreditCard,
    Truck,
    RotateCcw,
    DollarSign,
    Scale,
    PiggyBank,
    Receipt,
    ArrowUpRight
} from "lucide-react";

export type NavItem = {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string | number;
    subItems?: { title: string; href: string; icon?: React.ElementType }[];
};

export type NavGroup = {
    groupTitle: string;
    items: NavItem[];
};

const navigationGroups: NavGroup[] = [
    {
        groupTitle: "MAIN",
        items: [
            {
                title: "Dashboard",
                href: "/admin/dashboard",
                icon: LayoutDashboard,
            },
        ],
    },
    {
        groupTitle: "MANAGEMENT",
        items: [
            {
                title: "Catalogue",
                href: "/admin/catalogue",
                icon: ShoppingBag,
                subItems: [
                    { title: "Platform Products", href: "/admin/catalogue/products", icon: Boxes },
                    { title: "Seller Submissions", href: "/admin/catalogue/product-submissions", icon: FileCheck2 },
                    { title: "Product Revisions", href: "/admin/catalogue/product-revisions", icon: FolderKanban },
                    { title: "Categories", href: "/admin/catalogue/categories", icon: Layers },
                    { title: "Brands", href: "/admin/catalogue/brands", icon: Building2 },
                    { title: "Attributes", href: "/admin/catalogue/attributes", icon: Sliders },
                    { title: "Seller Listings", href: "/admin/catalogue/listings", icon: Tag },
                    { title: "Buy Box Monitoring", href: "/admin/catalogue/buy-box", icon: PackageCheck },
                    { title: "Inventory", href: "/admin/catalogue/inventory", icon: ListFilter },
                ],
            },
            {
                title: "Sellers",
                href: "/admin/sellers",
                icon: Users,
                subItems: [
                    { title: "All Sellers", href: "/admin/sellers", icon: Users },
                    { title: "Seller Approvals", href: "/admin/sellers/approvals", icon: UserCheck },
                    { title: "Verification", href: "/admin/sellers/verification", icon: Shield },
                    { title: "Performance", href: "/admin/sellers/performance", icon: TrendingUp },
                    { title: "Seller Staff", href: "/admin/sellers/staff", icon: UserPlus },
                ],
            },
            {
                title: "Customers",
                href: "/admin/customers",
                icon: UserCheck,
                subItems: [
                    { title: "All Customers", href: "/admin/customers", icon: Users },
                    { title: "Customer Reviews", href: "/admin/customers/reviews", icon: MessageSquare },
                    { title: "Support History", href: "/admin/customers/support-history", icon: History },
                ],
            },
            {
                title: "Orders",
                href: "/admin/orders",
                icon: ShoppingCart,
                subItems: [
                    { title: "All Orders", href: "/admin/orders", icon: ShoppingCart },
                    { title: "Seller Orders", href: "/admin/orders/seller-orders", icon: ShoppingBag },
                    { title: "Payments", href: "/admin/orders/payments", icon: CreditCard },
                    { title: "Shipments", href: "/admin/orders/shipments", icon: Truck },
                    { title: "Returns", href: "/admin/orders/returns", icon: RotateCcw },
                    { title: "Refunds", href: "/admin/orders/refunds", icon: DollarSign },
                ],
            },
        ],
    },
    {
        groupTitle: "FINANCE & MARKETING",
        items: [
            {
                title: "Finance",
                href: "/admin/finance",
                icon: Wallet,
                subItems: [
                    { title: "Commission Rules", href: "/admin/finance/commission-rules", icon: Scale },
                    { title: "Seller Earnings", href: "/admin/finance/earnings", icon: DollarSign },
                    { title: "Seller Wallets", href: "/admin/finance/wallets", icon: PiggyBank },
                    { title: "Wallet Transactions", href: "/admin/finance/wallet-transactions", icon: Receipt },
                    { title: "Withdrawal Requests", href: "/admin/finance/withdrawals", icon: ArrowUpRight },
                    { title: "Payouts", href: "/admin/finance/payouts", icon: CreditCard },
                    { title: "Reconciliation", href: "/admin/finance/reconciliation", icon: History },
                ],
            },
            {
                title: "Marketing",
                href: "/admin/marketing",
                icon: Megaphone,
                subItems: [
                    { title: "Coupons", href: "/admin/marketing/coupons", icon: BadgePercent },
                    { title: "Promotions", href: "/admin/marketing/promotions", icon: Megaphone },
                    { title: "Featured Products", href: "/admin/marketing/featured-products", icon: Sparkles },
                    { title: "Campaigns", href: "/admin/marketing/campaigns", icon: FolderKanban },
                ],
            },
        ],
    },
    {
        groupTitle: "SYSTEM & CONTENT",
        items: [
            {
                title: "Content",
                href: "/admin/content",
                icon: FileText,
                subItems: [
                    { title: "CMS Pages", href: "/admin/content/pages", icon: FileText },
                    { title: "FAQs", href: "/admin/content/faqs", icon: HelpCircle },
                    { title: "Navigation Menus", href: "/admin/content/navigation", icon: Compass },
                    { title: "Global SEO", href: "/admin/content/seo", icon: Globe },
                    { title: "Media Library", href: "/admin/content/media", icon: Image },
                ],
            },
            {
                title: "Support",
                href: "/admin/support",
                icon: Headphones,
                subItems: [
                    { title: "Conversations", href: "/admin/support/conversations", icon: MessageSquare },
                    { title: "Support Tickets", href: "/admin/support/tickets", icon: Ticket },
                    { title: "Disputes", href: "/admin/support/disputes", icon: AlertTriangle },
                ],
            },
            {
                title: "Reports",
                href: "/admin/reports",
                icon: BarChart3,
            },
            {
                title: "Administration",
                href: "/admin/administration",
                icon: Shield,
                subItems: [
                    { title: "Admin Users", href: "/admin/administration/users", icon: Users },
                    { title: "Roles", href: "/admin/administration/roles", icon: Shield },
                    { title: "Permissions", href: "/admin/administration/permissions", icon: KeyRound },
                    { title: "Notifications", href: "/admin/administration/notifications", icon: Bell },
                    { title: "System Settings", href: "/admin/administration/settings", icon: Settings },
                    { title: "Integrations", href: "/admin/administration/integrations", icon: Unplug },
                    { title: "Audit Logs", href: "/admin/administration/audit-logs", icon: History },
                ],
            },
        ],
    },
];

export function AdminSidebar({
    mobileOpen,
    setMobileOpen,
}: {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}) {
    const pathname = usePathname();
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(() => {
        for (const group of navigationGroups) {
            for (const item of group.items) {
                if (item.subItems?.some((sub) => pathname.startsWith(sub.href))) {
                    return item.title;
                }
            }
        }
        return null;
    });

    const handleLogout = async () => {
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/admin/login";
    };

    const toggleSubmenu = (title: string) => {
        setOpenSubmenu((prev) => (prev === title ? null : title));
    };

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Brand Logo Header */}
                <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100 dark:border-slate-800/80">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                            <span className="font-bold text-lg tracking-wider">C</span>
                        </div>
                        <div>
                            <span className="text-lg font-extrabold tracking-tight bg-linear-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                CONSULT
                            </span>
                            <span className="block text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                                Admin Platform
                            </span>
                        </div>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {navigationGroups.map((group, idx) => (
                        <div key={idx} className="space-y-1.5">
                            <h3 className="px-3 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                                {group.groupTitle}
                            </h3>
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isParentActive =
                                    pathname === item.href ||
                                    (item.subItems && item.subItems.some((s) => pathname.startsWith(s.href)));
                                const isSubOpen = openSubmenu === item.title;

                                if (item.subItems) {
                                    return (
                                        <div key={item.title} className="space-y-1">
                                            <button
                                                onClick={() => toggleSubmenu(item.title)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isParentActive
                                                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40"
                                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon
                                                        className={`w-5 h-5 ${isParentActive
                                                                ? "text-indigo-600 dark:text-indigo-400"
                                                                : "text-slate-400 dark:text-slate-500"
                                                            }`}
                                                    />
                                                    <span>{item.title}</span>
                                                </div>
                                                {isSubOpen ? (
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                )}
                                            </button>
                                            {isSubOpen && (
                                                <div className="pl-9 pr-2 py-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-5">
                                                    {item.subItems.map((sub) => {
                                                        const SubIcon = sub.icon;
                                                        const isSubActive = pathname === sub.href;
                                                        return (
                                                            <Link
                                                                key={sub.href}
                                                                href={sub.href}
                                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isSubActive
                                                                        ? "text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/60 dark:bg-indigo-950/30"
                                                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                                    }`}
                                                            >
                                                                {SubIcon && <SubIcon className="w-3.5 h-3.5" />}
                                                                <span>{sub.title}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isParentActive
                                                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 font-semibold shadow-xs"
                                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                className={`w-5 h-5 ${isParentActive
                                                        ? "text-indigo-600 dark:text-indigo-400"
                                                        : "text-slate-400 dark:text-slate-500"
                                                    }`}
                                            />
                                            <span>{item.title}</span>
                                        </div>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Bottom Promo Card matching reference screenshot */}
                <div className="p-4 m-4 rounded-2xl bg-linear-to-br from-indigo-50 via-slate-50 to-indigo-100/50 dark:from-slate-800 dark:to-indigo-950/40 border border-indigo-100 dark:border-slate-700/60 text-center space-y-3 relative overflow-hidden">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            Upgrade to PRO
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Get advanced analytics, custom reports & API access
                        </p>
                    </div>
                    <button className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]">
                        Upgrade Now
                    </button>
                </div>

                {/* Footer User Logout */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                            A
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                                Admin Account
                            </p>
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                Super Administrator
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </aside>
        </>
    );
}
