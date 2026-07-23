"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { HeroSlide } from "./HeroSection";

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = slides.length;

  const goTo = (next: number, dir: "left" | "right") => {
    if (transitioning || next === current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDirection(dir);
    setPrevIdx(current);
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(next);
      setPrevIdx(null);
      setTransitioning(false);
    }, 480);
  };

  const goPrev = () => goTo((current - 1 + total) % total, "left");
  const goNext = () => goTo((current + 1) % total, "right");

  // Auto-advance
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      goTo((current + 1) % total, "right");
    }, 5500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const slide = slides[current];
  const prevSlide = prevIdx !== null ? slides[prevIdx] : null;

  // Content animation
  const contentOut = transitioning;
  const contentDir = direction === "right" ? "-24px" : "24px";

  return (
    <div className="relative w-full overflow-hidden">
      {/* ══════════════════════════════════════════════════════════
          BACKGROUND IMAGES — Aspect Ratio & Full Width
      ══════════════════════════════════════════════════════════ */}
      <div className="relative w-full aspect-16/10 md:aspect-21/9 min-h-[360px] md:min-h-[580px] lg:min-h-[640px] overflow-hidden">

        {/* Outgoing image (fades out during transition) */}
        {prevSlide && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 w-full h-full"
            style={{
              opacity: transitioning ? 0 : 1,
              transition: "opacity 480ms ease-in-out",
            }}
          >
            <Image
              src={prevSlide.image}
              alt={prevSlide.imageAlt}
              fill
              className="object-cover object-center w-full h-full"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-linear-to-b from-matt-black-100/60 via-matt-black-100/85 to-matt-black-100 md:bg-none" />
            <div className="absolute inset-0 hidden md:block bg-linear-to-r from-matt-black-100 via-matt-black-100/80 to-matt-black-100/15" />
            <div className="absolute inset-0 bg-linear-to-t from-matt-black-100 via-transparent to-transparent" />
          </div>
        )}

        {/* Current image (always visible) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-1 w-full h-full"
          style={{
            opacity: 1,
            transition: "opacity 480ms ease-in-out",
          }}
        >
          <Image
            src={slide.image}
            alt={slide.imageAlt}
            fill
            priority={current === 0}
            className="object-cover object-center w-full h-full"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-b from-matt-black-100/60 via-matt-black-100/82 to-matt-black-100 md:bg-none" />
          <div className="absolute inset-0 hidden md:block bg-linear-to-r from-matt-black-100 via-matt-black-100/78 to-matt-black-100/15" />
          <div className="absolute inset-0 bg-linear-to-t from-matt-black-100 via-transparent to-transparent" />
        </div>

        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="absolute z-2 rounded-full blur-[160px] opacity-20 pointer-events-none transition-colors duration-700 ease-out
                     bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px]
                     md:top-1/2 md:left-0 md:translate-x-0 md:-translate-y-1/2 md:w-[500px] md:h-[500px]"
          style={{ backgroundColor: slide.accentColor }}
        />

        {/* ══════════════════════════════════════════════════════════
            MAIN CONTENT (Overlayed inside aspect ratio container)
        ══════════════════════════════════════════════════════════ */}
        <div className="absolute inset-0 z-10 w-full h-full flex items-end md:items-center">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pb-6 pt-4 md:py-0">

            {/* ── Text Block ── */}
            <div
              className="w-full md:max-w-xl lg:max-w-2xl"
              style={{
                opacity: contentOut ? 0 : 1,
                transform: contentOut ? `translateX(${contentDir})` : "translateX(0)",
                transition: contentOut
                  ? "opacity 220ms ease-in, transform 220ms ease-in"
                  : "opacity 380ms ease-out, transform 380ms ease-out",
              }}
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-5">
                <span
                  className="inline-flex items-center text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
                  style={{
                    color: slide.accentColor,
                    borderColor: `${slide.accentColor}55`,
                    backgroundColor: `${slide.accentColor}18`,
                    fontFamily: "var(--font-sora), sans-serif",
                  }}
                >
                  {slide.badge}
                </span>
                <span
                  className="inline-flex items-center text-[10px] sm:text-xs font-semibold text-white-chalk-300/70 bg-matt-black-200/60 px-2.5 py-1 rounded-full border border-matt-black-300/30"
                  style={{ fontFamily: "var(--font-sora), sans-serif" }}
                >
                  {slide.tag}
                </span>
              </div>

              {/* Sub-headline */}
              <p
                className="text-[10px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-matt-black-400 mb-2 md:mb-3"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                {slide.subheadline}
              </p>

              {/* Main headline */}
              <h1
                className="font-extrabold leading-[1.06] text-white-chalk-100 mb-3 md:mb-6 whitespace-pre-line"
                style={{
                  fontFamily: "var(--font-sora), sans-serif",
                  fontSize: "clamp(1.85rem, 7.5vw, 4.5rem)",
                }}
              >
                {slide.headline}
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-matt-black-400 leading-relaxed mb-5 md:mb-8 max-w-xs sm:max-w-sm md:max-w-lg">
                {slide.description}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Link
                  href={slide.ctaHref}
                  id={`hero-cta-primary-${slide.id}`}
                  className="group inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-bold text-sm text-matt-black-100 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-lg"
                  style={{
                    backgroundColor: slide.accentColor,
                    fontFamily: "var(--font-sora), sans-serif",
                  }}
                >
                  {slide.ctaLabel}
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  href={slide.secondaryCtaHref}
                  id={`hero-cta-secondary-${slide.id}`}
                  className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-semibold text-sm text-white-chalk-200 border border-matt-black-300/60 bg-matt-black-200/40 backdrop-blur-sm hover:bg-matt-black-200/70 hover:border-matt-black-300 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {slide.secondaryCtaLabel}
                </Link>
              </div>
            </div>

            {/* ── Controls ── */}
            <div className="flex items-center gap-3 sm:gap-4 mt-7 md:mt-12">
              <div className="flex items-center gap-2">
                <button
                  id="hero-prev-btn"
                  onClick={goPrev}
                  aria-label="Previous slide"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-matt-black-300/60 bg-matt-black-200/50 backdrop-blur-sm text-white-chalk-300 hover:bg-matt-black-200 hover:text-sunflower-100 hover:border-sunflower-100/40 transition-all duration-200 flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  id="hero-next-btn"
                  onClick={goNext}
                  aria-label="Next slide"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-matt-black-300/60 bg-matt-black-200/50 backdrop-blur-sm text-white-chalk-300 hover:bg-matt-black-200 hover:text-sunflower-100 hover:border-sunflower-100/40 transition-all duration-200 flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Dots */}
              <div className="flex items-center gap-2" role="tablist" aria-label="Slide indicators">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    role="tab"
                    id={`hero-dot-${i}`}
                    aria-selected={i === current}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => goTo(i, i > current ? "right" : "left")}
                    className="rounded-full cursor-pointer"
                    style={{
                      width: i === current ? "22px" : "7px",
                      height: "7px",
                      backgroundColor:
                        i === current ? slide.accentColor : "rgba(203,202,202,0.3)",
                      transition: "all 300ms ease",
                    }}
                  />
                ))}
              </div>

              {/* Counter */}
              <span className="text-xs text-matt-black-400 font-mono ml-auto" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
                <span className="text-white-chalk-300 font-bold">
                  {String(current + 1).padStart(2, "0")}
                </span>
                {" / "}
                {String(total).padStart(2, "0")}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
