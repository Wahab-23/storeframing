// Server Component — no "use client"

import Image from "next/image";
import { CarouselShell } from "./CarouselShell";
import { Star } from "lucide-react";

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  rating: number;
  text: string;
}

interface TestimonialsCarouselProps {
  title?: string;
  subtitle?: string;
  testimonials: Testimonial[];
}

export function TestimonialsCarousel({
  title = "What Our Customers Say",
  subtitle,
  testimonials,
}: TestimonialsCarouselProps) {
  return (
    <CarouselShell
      title={title}
      subtitle={subtitle}
      accentColor="#118217"
    >
      {testimonials.map((testimonial) => (
        <div key={testimonial.id} className="snap-start shrink-0">
          <TestimonialCard testimonial={testimonial} />
        </div>
      ))}
    </CarouselShell>
  );
}

// ── Testimonial Card — Server Component ──────────────────────────────────────

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="relative flex flex-col justify-between w-70 sm:w-[320px] h-55 p-6 rounded-2xl border border-matt-black-500 bg-white-chalk-100 hover:shadow-[0_8px_30px_rgba(17,130,23,0.08)] hover:-translate-y-1 transition-all duration-300">
      {/* Background Quote Watermark */}
      <div
        aria-hidden="true"
        className="absolute top-4 right-6 text-[80px] leading-none text-pablano-500/20 font-serif pointer-events-none select-none"
      >
        "
      </div>

      <div>
        {/* Rating */}
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < testimonial.rating
                  ? "fill-sunflower-100 text-sunflower-100"
                  : "fill-matt-black-500 text-matt-black-500"
                }`}
            />
          ))}
        </div>

        {/* Text */}
        <p className="text-sm text-matt-black-300 italic line-clamp-4 relative z-10">
          "{testimonial.text}"
        </p>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 mt-4">
        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-matt-black-500">
          <Image
            src={testimonial.avatar}
            alt={testimonial.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
        <div>
          <p
            className="text-sm font-bold text-matt-black-100"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            {testimonial.name}
          </p>
          {testimonial.role && (
            <p className="text-[10px] text-matt-black-400">
              {testimonial.role}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
