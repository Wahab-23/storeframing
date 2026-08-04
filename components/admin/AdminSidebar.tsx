"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Store,
  Users,
  ShoppingCart,
  Banknote,
  Megaphone,
  FileText,
  LifeBuoy,
  BarChart3,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const navModules = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    name: "Catalogue",
    icon: Package,
    submenus: [
      { name: "Platform Products", href: "/admin/catalogue/products" },
      { name: "Seller Submissions", href: "/admin/catalogue/product-submissions" },
      { name: "Categories", href: "/admin/catalogue/categories" },
      { name: "Brands", href: "/admin/catalogue/brands" },
      { name: "Attributes", href: "/admin/catalogue/attributes" },
      { name: "Inventory", href: "/admin/catalogue/inventory" },
    ],
  },
  {
    name: "Sellers",
    icon: Store,
    submenus: [
      { name: "All Sellers", href: "/admin/sellers" },
      { name: "Approvals", href: "/admin/sellers/approvals" },
      { name: "Verification", href: "/admin/sellers/verification" },
      { name: "Performance", href: "/admin/sellers/performance" },
    ],
  },
  {
    name: "Customers",
    icon: Users,
    submenus: [
      { name: "All Customers", href: "/admin/customers" },
      { name: "Reviews", href: "/admin/customers/reviews" },
    ],
  },
  {
    name: "Orders",
    icon: ShoppingCart,
    submenus: [
      { name: "All Orders", href: "/admin/orders" },
      { name: "Returns", href: "/admin/orders/returns" },
      { name: "Refunds", href: "/admin/orders/refunds" },
    ],
  },
  {
    name: "Finance",
    icon: Banknote,
    submenus: [
      { name: "Commission Rules", href: "/admin/finance/commission-rules" },
      { name: "Seller Earnings", href: "/admin/finance/earnings" },
      { name: "Withdrawals", href: "/admin/finance/withdrawals" },
      { name: "Reconciliation", href: "/admin/finance/reconciliation" },
    ],
  },
  {
    name: "Marketing",
    icon: Megaphone,
    submenus: [
      { name: "Coupons", href: "/admin/marketing/coupons" },
      { name: "Promotions", href: "/admin/marketing/promotions" },
    ],
  },
  {
    name: "Content",
    icon: FileText,
    submenus: [
      { name: "CMS Pages", href: "/admin/content/pages" },
      { name: "Media Library", href: "/admin/content/media" },
    ],
  },
  {
    name: "Support",
    icon: LifeBuoy,
    submenus: [
      { name: "Conversations", href: "/admin/support/conversations" },
      { name: "Tickets", href: "/admin/support/tickets" },
      { name: "Disputes", href: "/admin/support/disputes" },
    ],
  },
  {
    name: "Reports",
    icon: BarChart3,
    submenus: [
      { name: "Sales Reports", href: "/admin/reports" },
      { name: "Exports", href: "/admin/reports/exports" },
    ],
  },
  {
    name: "Administration",
    icon: Settings,
    submenus: [
      { name: "Admin Users", href: "/admin/administration/users" },
      { name: "Roles", href: "/admin/administration/roles" },
      { name: "System Settings", href: "/admin/administration/settings" },
      { name: "Audit Logs", href: "/admin/administration/audit-logs" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside
      className="w-64 flex flex-col h-screen border-r shrink-0"
      style={{
        background: "linear-gradient(180deg, #0d1117 0%, #111827 100%)",
        borderColor: "rgba(252,192,20,0.12)",
      }}
    >
      {/* Logo */}
      <div
        className="h-16 flex items-center gap-3 px-5 border-b"
        style={{ borderColor: "rgba(252,192,20,0.12)" }}
      >
        <Image
          src="/company-identity/Insignia.svg"
          alt="iShopping"
          width={32}
          height={22}
          className="shrink-0"
        />
        <div>
          <p className="text-white font-bold text-sm leading-none tracking-tight">
            iShopping
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: "#FCC014" }}>
            Admin Console
          </p>
        </div>
        {/* Pulse indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#22c55e" }}
          />
          <span className="text-xs" style={{ color: "#22c55e" }}>
            Live
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        <nav className="space-y-0.5 px-2">
          {navModules.map((module) => {
            const isActive = module.href
              ? pathname === module.href
              : module.submenus?.some((s) => pathname.startsWith(s.href));
            const isOpen = openMenus[module.name] || isActive;

            return (
              <div key={module.name}>
                {module.href ? (
                  <Link
                    href={module.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium group"
                    style={
                      isActive
                        ? {
                            background: "rgba(252,192,20,0.12)",
                            color: "#FCC014",
                          }
                        : {
                            color: "rgba(255,255,255,0.45)",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "#fff";
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(255,255,255,0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color =
                          "rgba(255,255,255,0.45)";
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                      }
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 w-0.5 h-6 rounded-r-full"
                        style={{ background: "#FCC014" }}
                      />
                    )}
                    <module.icon className="w-4 h-4 shrink-0" />
                    <span>{module.name}</span>
                  </Link>
                ) : (
                  <div>
                    <button
                      onClick={() => toggleMenu(module.name)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm font-medium"
                      style={
                        isActive
                          ? { color: "#FCC014" }
                          : { color: "rgba(255,255,255,0.45)" }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.color = "#fff";
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(255,255,255,0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.color =
                            "rgba(255,255,255,0.45)";
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <module.icon className="w-4 h-4 shrink-0" />
                        <span>{module.name}</span>
                      </div>
                      <ChevronRight
                        className="w-3.5 h-3.5 transition-transform duration-200"
                        style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      />
                    </button>
                    {isOpen && module.submenus && (
                      <div className="mt-0.5 ml-7 pl-3 space-y-0.5 border-l" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        {module.submenus.map((sub) => {
                          const subActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.name}
                              href={sub.href}
                              className="block px-2 py-1.5 text-xs rounded-md transition-all"
                              style={
                                subActive
                                  ? { color: "#FCC014", fontWeight: 600 }
                                  : { color: "rgba(255,255,255,0.40)" }
                              }
                              onMouseEnter={(e) => {
                                if (!subActive)
                                  (e.currentTarget as HTMLElement).style.color =
                                    "rgba(255,255,255,0.85)";
                              }}
                              onMouseLeave={(e) => {
                                if (!subActive)
                                  (e.currentTarget as HTMLElement).style.color =
                                    "rgba(255,255,255,0.40)";
                              }}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User footer */}
      <div
        className="p-3 border-t"
        style={{ borderColor: "rgba(252,192,20,0.12)" }}
      >
        <div
          className="flex items-center gap-3 p-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "#FCC014", color: "#0d1117" }}
          >
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">Admin User</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
              Super Admin
            </p>
          </div>
          <button
            className="p-1.5 rounded-md transition-colors cursor-pointer"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#ef4444")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "rgba(255,255,255,0.35)")
            }
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
