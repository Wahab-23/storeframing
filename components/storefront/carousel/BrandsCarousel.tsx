// Server Component — no "use client"

import Image from "next/image";
import Link from "next/link";
import { CarouselShell } from "./CarouselShell";

export interface Brand {
  id: string;
  name: string;
  logo: string;
  slug: string;
  tagline?: string;
}

interface BrandsCarouselProps {
  title?: string;
  subtitle?: string;
  brands: Brand[];
}

export function BrandsCarousel({
  title = "Top Brands",
  subtitle,
  brands,
}: BrandsCarouselProps) {
  return (
    <CarouselShell
      title={title}
      subtitle={subtitle}
      accentColor="#FCC014"
    >
      {brands.map((brand) => (
        <div key={brand.id} className="snap-start shrink-0">
          <BrandCard brand={brand} />
        </div>
      ))}
    </CarouselShell>
  );
}

// ── Brand Card — Server Component ────────────────────────────────────────────
// All hover effects are pure CSS — no JS, no event handlers.

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link
      href={`/brand/${brand.slug}`}
      id={`brand-card-${brand.id}`}
      className="group relative flex flex-col items-center justify-center gap-3 w-35 sm:w-40 h-28 sm:h-29 rounded-2xl border border-matt-black-500 bg-white-chalk-100 hover:border-sunflower-100/60 hover:shadow-[0_4px_24px_rgba(252,192,20,0.12)] transition-all duration-300 hover:-translate-y-1 hover:bg-white-chalk-200 cursor-pointer overflow-hidden"
    >
      {/* Logo — grayscale at rest, full color on hover (pure CSS) */}
      <div className="relative w-16 h-10 shrink-0">
        <Image
          src={brand.logo}
          alt={`${brand.name} logo`}
          fill
          className="object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
          sizes="64px"
        />
      </div>

      {/* Name & tagline */}
      <div className="text-center px-2">
        <p
          className="text-xs font-bold text-matt-black-300 group-hover:text-matt-black-100 transition-colors duration-300 leading-tight"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          {brand.name}
        </p>
        {brand.tagline && (
          <p className="text-[10px] text-matt-black-400 mt-0.5 truncate">{brand.tagline}</p>
        )}
      </div>

      {/* Sunflower accent underline — CSS scale animation */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-0.5 bg-sunflower-100 rounded-b-2xl scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"
      />
    </Link>
  );
}
