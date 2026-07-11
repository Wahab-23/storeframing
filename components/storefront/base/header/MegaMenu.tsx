"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { HeaderNavCategory } from "./types";

interface MegaMenuProps {
  navigation: HeaderNavCategory[];
}

export function MegaMenu({ navigation }: MegaMenuProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<number>(0);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ─── Delayed close to prevent flicker ───────────────────────────────────────
  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setActiveCategory(null);
      setActiveSubcategory(0);
    }, 150);
  }, []);

  const handleCategoryEnter = useCallback(
    (index: number) => {
      clearCloseTimer();
      setActiveCategory(index);
      setActiveSubcategory(0);
    },
    [clearCloseTimer]
  );

  const handleMenuEnter = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  const handleMenuLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  // ─── Escape key handler ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveCategory(null);
        setActiveSubcategory(0);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ─── Cleanup timer on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const activeCategoryData =
    activeCategory !== null ? navigation[activeCategory] : null;

  return (
    <div ref={menuRef}>
      {/* ── Navigation Bar ── */}
      <nav className="bg-matt-black-200 border-b border-matt-black-300/20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-11 gap-0 overflow-x-auto scrollbar-hide">
            {navigation.map((cat, index) => (
              <a
                key={cat.label}
                href={cat.href}
                onMouseEnter={() => handleCategoryEnter(index)}
                onMouseLeave={scheduleClose}
                className={`relative flex items-center whitespace-nowrap px-4 h-full text-[13px] font-semibold tracking-wide transition-colors duration-200 ${activeCategory === index
                  ? "text-sunflower-100"
                  : "text-white-chalk-100 hover:text-sunflower-100"
                  }`}
              >
                {cat.label}
                {/* Active indicator bar */}
                {activeCategory === index && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-sunflower-100 rounded-full" />
                )}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Megamenu Panel ── */}
      {activeCategoryData && (
        <div
          className="absolute left-0 right-0 z-50 bg-white-chalk-100 shadow-[0_12px_40px_rgba(0,0,0,0.15)] border-b border-white-chalk-400"
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleMenuLeave}
        >
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-0 min-h-[320px]">
              {/* Left: Subcategory list */}
              <div className="w-[240px] shrink-0 border-r border-matt-black-500/50 pr-2">
                {activeCategoryData.subcategories.map((sub, subIndex) => (
                  <a
                    key={sub.label}
                    href={sub.href}
                    onMouseEnter={() => setActiveSubcategory(subIndex)}
                    className={`group flex items-center justify-between px-3 py-2.5 text-sm ${activeSubcategory === subIndex
                      ? "text-matt-black-100 font-semibold border-l border-sunflower-100"
                      : "text-matt-black-300 font-medium hover:bg-white-chalk-200 hover:text-matt-black-100"
                      }`}
                  >
                    <span>{sub.label}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-all duration-150 ${activeSubcategory === subIndex
                        ? "opacity-100 text-matt-black-100 translate-x-0"
                        : "opacity-0 -translate-x-1"
                        }`}
                    />
                  </a>
                ))}
              </div>

              {/* Right: Links for active subcategory */}
              <div className="flex-1 pl-8">
                <h3 className="text-base font-bold text-matt-black-100 mb-4 pb-2 border-b border-matt-black-500/30">
                  {activeCategoryData.subcategories[activeSubcategory]?.label}
                </h3>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-1.5">
                  {activeCategoryData.subcategories[activeSubcategory]?.links.map(
                    (link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="group/link flex items-center gap-2 py-1.5 text-sm text-matt-black-300 hover:text-matt-black-100 hover:font-medium transition-all duration-150"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-matt-black-500/40 group-hover/link:bg-sunflower-100 transition-colors duration-150 shrink-0" />
                        {link.label}
                      </a>
                    )
                  )}
                </div>

                {/* Brands section */}
                {activeCategoryData.brands &&
                  activeCategoryData.brands.length > 0 && (
                    <div className="mt-8 pt-5 border-t border-matt-black-500/30">
                      <h4 className="text-xs font-bold text-matt-black-400 uppercase tracking-wider mb-3">
                        Top Brands
                      </h4>
                      <div className="flex items-center gap-4 flex-wrap">
                        {activeCategoryData.brands.map((brand) => (
                          <a
                            key={brand.name}
                            href={brand.href}
                            title={brand.name}
                            className="flex items-center justify-center px-4 py-2 rounded-lg border border-matt-black-500/50 bg-white-chalk-200 hover:border-sunflower-100/30 hover:shadow-sm transition-all duration-200 text-xs font-bold text-matt-black-300 hover:text-matt-black-100 uppercase tracking-wider"
                          >
                            {brand.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
