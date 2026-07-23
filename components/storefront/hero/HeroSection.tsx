import { Zap, Shield, Truck } from "lucide-react";
import { HeroCarousel } from "./HeroCarousel";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface HeroSlide {
  id: string;
  image: string;
  imageAlt: string;
  badge: string;
  headline: string;
  subheadline: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  accentColor: string;
  tag: string;
}

// ─── Slide Data ────────────────────────────────────────────────────────────────

const slides: HeroSlide[] = [
  {
    id: "electronics",
    image: "/hero-banner.png",
    imageAlt: "Electronics & Gadgets — smartphones, headphones, and tech accessories",
    badge: "New Arrivals 2026",
    headline: "Shop the Future,\nToday.",
    subheadline: "Electronics & Gadgets",
    description:
      "Discover the latest smartphones, laptops, and audio gear from the world's top brands — delivered fast to your door.",
    ctaLabel: "Explore Electronics",
    ctaHref: "/electronics",
    secondaryCtaLabel: "View All Deals",
    secondaryCtaHref: "/deals",
    accentColor: "#FCC014",
    tag: "Up to 40% off",
  },
  {
    id: "fashion",
    image: "/hero-banner-fashion.png",
    imageAlt: "Fashion & Apparel — leather jackets, handbags, and premium accessories",
    badge: "Season's Best",
    headline: "Style That\nSpeaks Volumes.",
    subheadline: "Fashion & Apparel",
    description:
      "From casual streetwear to premium formals — curated collections for every occasion and every taste.",
    ctaLabel: "Shop Men's Fashion",
    ctaHref: "/mens-fashion",
    secondaryCtaLabel: "Explore Women's",
    secondaryCtaHref: "/womens-fashion",
    accentColor: "#059BB5",
    tag: "Free shipping over ₨2,000",
  },
  {
    id: "home",
    image: "/hero-banner-home.png",
    imageAlt: "Home & Living — premium lamps, vases, cushions, and kitchen appliances",
    badge: "Big Home Sale",
    headline: "Transform Your\nHome Space.",
    subheadline: "Home & Living",
    description:
      "Elevate your living with premium furniture, smart appliances, and beautiful décor — all in one place.",
    ctaLabel: "Shop Home & Living",
    ctaHref: "/home-living",
    secondaryCtaLabel: "See What's Hot",
    secondaryCtaHref: "/home-living/decor",
    accentColor: "#118217",
    tag: "Big home sale",
  },
];

// ─── Trust Badges ──────────────────────────────────────────────────────────────

const trustBadges = [
  { icon: Truck, label: "Fast Delivery", sub: "2–4 working days" },
  { icon: Shield, label: "Secure Payments", sub: "100% encrypted" },
  { icon: Zap, label: "Flash Deals", sub: "Every day at midnight" },
];

// ─── Server Component ──────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <section
      id="hero-section"
      aria-label="Hero Banner"
      className="relative w-full overflow-hidden bg-matt-black-100 flex flex-col"
    >
      {/* 
        This is a lightweight Server Component. 
        It offloads the stateful interactive carousel logic, timer, and transitions 
        to a clientside sub-component, keeping initial HTML generation on the server.
      */}
      <HeroCarousel slides={slides} />

      {/* ══════════════════════════════════════════════════════════
          TRUST BADGES STRIP (Static Server Rendered)
      ══════════════════════════════════════════════════════════ */}
      {/* <div className="relative z-10 border-t border-matt-black-200/60 bg-matt-black-100/85 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-matt-black-200/60">
            {trustBadges.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-2 sm:px-4 lg:px-6">
                <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sunflower-100/10 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sunflower-100" />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-[11px] sm:text-xs font-bold text-white-chalk-200 leading-tight truncate"
                    style={{ fontFamily: "var(--font-sora), sans-serif" }}
                  >
                    {label}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-matt-black-400 leading-tight truncate hidden sm:block">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </section>
  );
}
