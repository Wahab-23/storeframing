"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, ChevronRight, User, Heart, ShoppingCart } from "lucide-react";
import { HeaderNavCategory, HeaderActionLink } from "./types";
import { SearchBar } from "./SearchBar";
import Link from "next/link";

interface MobileMenuProps {
  navigation: HeaderNavCategory[];
  actions: HeaderActionLink[];
}

// ─── Action icon map ──────────────────────────────────────────────────────────

function ActionIcon({ icon }: { icon: HeaderActionLink["icon"] }) {
  const cls = "w-5 h-5 stroke-[1.8]";
  if (icon === "user") return <User className={cls} />;
  if (icon === "heart") return <Heart className={cls} />;
  return <ShoppingCart className={cls} />;
}

export function MobileMenu({ navigation, actions }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleCategory = (label: string) => {
    setExpandedCategory((prev) => (prev === label ? null : label));
    setExpandedSubcategory(null);
  };

  const toggleSubcategory = (label: string) => {
    setExpandedSubcategory((prev) => (prev === label ? null : label));
  };

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:text-black hover:bg-gray-100 transition-colors duration-200"
      >
        <Menu className="w-5 h-5 stroke-2" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-998 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`flex flex-col h-full fixed top-0 left-0 bottom-0 z-999 w-[85vw] max-w-95 bg-matt-black-100 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-matt-black-200">
          <span className="text-sunflower-100 font-bold text-base tracking-wide">
            Menu
          </span>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-white-chalk-400 hover:text-white-chalk-100 hover:bg-matt-black-200 transition-colors duration-200"
          >
            <X className="w-5 h-5 stroke-2" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-matt-black-200">
          <SearchBar placeholder="Search..." />
        </div>

        {/* Actions (Sign In, Wishlist, Cart) */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-matt-black-200">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white-chalk-400 hover:text-sunflower-100 hover:bg-matt-black-200 transition-colors duration-200 text-sm font-medium"
            >
              <ActionIcon icon={action.icon} />
              <span>{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Navigation accordion */}
        <div className="flex-1 px-2 py-2 overflow-scroll pb-10">
          {navigation.map((cat) => {
            const isCatExpanded = expandedCategory === cat.label;
            return (
              <div key={cat.label} className="mb-0.5">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat.label)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left text-sm font-semibold tracking-wide transition-colors duration-150 ${isCatExpanded
                    ? "text-sunflower-100 bg-matt-black-200/60"
                    : "text-white-chalk-100 hover:bg-matt-black-200/40"
                    }`}
                >
                  <span>{cat.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isCatExpanded ? "rotate-180 text-sunflower-100" : "text-matt-black-400"
                      }`}
                  />
                </button>

                {/* Subcategories */}
                {isCatExpanded && (
                  <div className="ml-2 pl-3 border-l border-matt-black-300/30 mt-1 mb-2">
                    {cat.subcategories.map((sub) => {
                      const isSubExpanded = expandedSubcategory === sub.label;
                      return (
                        <div key={sub.label}>
                          <button
                            onClick={() => toggleSubcategory(sub.label)}
                            className={`w-full flex items-center justify-between px-2 py-2 rounded text-left text-sm transition-colors duration-150 ${isSubExpanded
                              ? "text-sunflower-100 font-semibold"
                              : "text-matt-black-400 hover:text-white-chalk-100 font-medium"
                              }`}
                          >
                            <span>{sub.label}</span>
                            <ChevronRight
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${isSubExpanded ? "rotate-90 text-sunflower-100" : "text-matt-black-400"
                                }`}
                            />
                          </button>

                          {/* Links */}
                          {isSubExpanded && (
                            <div className="ml-3 pl-2 border-l border-matt-black-300/20 mb-2">
                              {sub.links.map((link) => (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  onClick={() => setIsOpen(false)}
                                  className="block px-2 py-1.5 text-[13px] text-matt-black-400 hover:text-sunflower-100 transition-colors duration-150"
                                >
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
