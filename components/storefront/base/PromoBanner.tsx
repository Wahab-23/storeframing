import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface PromoBannerProps {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
  /** Hex background color for the text block */
  bgColor?: string;
  /** Hex text color for the title */
  textColor?: string;
}

export function PromoBanner({
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
  imageSrc,
  imageAlt,
  bgColor = "#D7EBF0", // munsell-blue-500
  textColor = "#059BB5", // munsell-blue-100
}: PromoBannerProps) {
  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="flex flex-col md:flex-row w-full rounded-4xl overflow-hidden shadow-lg border border-matt-black-500/50">

        {/* Text Content */}
        <div
          className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-20 order-2 md:order-1"
          style={{ backgroundColor: bgColor }}
        >
          <p
            className="text-[10px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-matt-black-400 mb-3"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            {subtitle}
          </p>
          <h2
            className="text-3xl md:text-5xl font-extrabold leading-tight mb-4"
            style={{
              fontFamily: "var(--font-sora), sans-serif",
              color: textColor
            }}
          >
            {title}
          </h2>
          <p className="text-sm md:text-base text-matt-black-200 mb-8 max-w-md">
            {description}
          </p>

          <div>
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl font-bold text-sm text-white-chalk-100 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-md"
              style={{
                backgroundColor: textColor,
                fontFamily: "var(--font-sora), sans-serif",
              }}
            >
              {ctaText}
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 relative min-h-75 md:min-h-100 order-1 md:order-2 overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover object-center transition-transform duration-700 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-matt-black-100/40 md:from-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
