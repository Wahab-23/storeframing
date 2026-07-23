// Server Component — no "use client"

import Image from "next/image";
import Link from "next/link";
import { CarouselShell } from "./CarouselShell";

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  itemCount?: number;
  /** Hex color used for the gradient overlay and card accent */
  accentColor?: string;
}

interface CategoryCarouselProps {
  title?: string;
  subtitle?: string;
  categories: Category[];
  viewAllHref?: string;
}

export function CategoryCarousel({
  title = "Shop by Category",
  subtitle,
  categories,
  viewAllHref,
}: CategoryCarouselProps) {
  return (
    <CarouselShell
      title={title}
      subtitle={subtitle}
      viewAllHref={viewAllHref}
      viewAllLabel="All Categories"
      accentColor="#059BB5"
    >
      {categories.map((cat) => (
        <div key={cat.id} className="snap-start shrink-0">
          <CategoryCard category={cat} />
        </div>
      ))}
    </CarouselShell>
  );
}

// ── Category Card — Server Component ────────────────────────────────────────

function CategoryCard({ category }: { category: Category }) {
  const accent = category.accentColor ?? "#059BB5";

  return (
    <Link
      href={`/category/${category.slug}`}
      id={`category-card-${category.id}`}
      className="group relative flex w-40 sm:w-47.5 rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
    >
      {/* Image */}
      <div className="relative w-full aspect-square overflow-hidden">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 160px, 190px"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `linear-gradient(to top, ${accent}cc 0%, ${accent}22 50%, transparent 100%)`,
          }}
        />
      </div>

      {/* Label */}
      <div className="absolute bottom-0 inset-x-0 p-3">
        <p
          className="text-sm font-bold text-white leading-tight mb-0.5 drop-shadow"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          {category.name}
        </p>
        {category.itemCount != null && (
          <p className="text-[11px] text-white/70 font-medium">
            {category.itemCount.toLocaleString()} items
          </p>
        )}
      </div>

      {/* Hover accent border */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ borderColor: accent }}
      />
    </Link>
  );
}
