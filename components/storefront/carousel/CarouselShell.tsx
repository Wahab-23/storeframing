"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";

interface CarouselShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Hex color string only, e.g. "#FCC014" */
  accentColor?: string;
}

export function CarouselShell({
  children,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View All",
  accentColor = "#FCC014",
}: CarouselShellProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [sync]);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "right" ? el.clientWidth * 0.75 : -(el.clientWidth * 0.75),
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full py-10 md:py-14 overflow-hidden">
      {/* ── Header ── */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            {subtitle && (
              <p
                className="text-[10px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-matt-black-400 mb-1"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                {subtitle}
              </p>
            )}
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-matt-black-100 leading-tight"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-70"
                style={{ color: accentColor, fontFamily: "var(--font-sora), sans-serif" }}
              >
                {viewAllLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <NavButton
              dir="left"
              disabled={!canScrollLeft}
              onClick={() => scroll("left")}
              accentColor={accentColor}
            />
            <NavButton
              dir="right"
              disabled={!canScrollRight}
              onClick={() => scroll("right")}
              accentColor={accentColor}
            />
          </div>
        </div>
      </div>

      {/* ── Track — constrained to same max-width as header ── */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Left edge fade */}
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 z-10 pointer-events-none transition-opacity duration-300"
            style={{
              background: "linear-gradient(to right, var(--color-white-chalk-100), transparent)",
              opacity: canScrollLeft ? 1 : 0,
            }}
          />
          {/* Right edge fade */}
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 z-10 pointer-events-none transition-opacity duration-300"
            style={{
              background: "linear-gradient(to left, var(--color-white-chalk-100), transparent)",
              opacity: canScrollRight ? 1 : 0,
            }}
          />

          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto scroll-smooth py-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Shared nav button ────────────────────────────────────────────────────────

function NavButton({
  dir,
  disabled,
  onClick,
  accentColor,
}: {
  dir: "left" | "right";
  disabled: boolean;
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
      className="w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
      style={
        disabled
          ? {
            borderColor: "var(--color-matt-black-500)",
            color: "var(--color-matt-black-400)",
            backgroundColor: "transparent",
          }
          : {
            borderColor: accentColor + "88",
            color: accentColor,
            backgroundColor: accentColor + "14",
          }
      }
    >
      {dir === "left" ? (
        <ChevronLeft className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>
  );
}
