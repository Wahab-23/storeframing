// Server Component — no "use client"

import { CarouselShell } from "./CarouselShell";
import { ProductCard } from "@/components/storefront/product-card/ProductCard";
import { Product } from "@/components/storefront/product-card/types";

interface ProductCarouselProps {
  title?: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
  /** Hex color, e.g. "#FCC014". Defaults to sunflower. */
  accentColor?: string;
}

export function ProductCarousel({
  title = "Featured Products",
  subtitle,
  products,
  viewAllHref,
  accentColor = "#FCC014",
}: ProductCarouselProps) {
  return (
    <CarouselShell
      title={title}
      subtitle={subtitle}
      viewAllHref={viewAllHref}
      viewAllLabel="View All"
      accentColor={accentColor}
    >
      {products.map((product) => (
        <div key={product.id} className="snap-start shrink-0">
          <ProductCard product={product} />
        </div>
      ))}
    </CarouselShell>
  );
}
