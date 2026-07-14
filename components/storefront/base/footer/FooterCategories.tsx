"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FooterCategory } from "./types";
import Link from "next/link";

interface FooterCategoriesProps {
  categories: FooterCategory[];
}

export function FooterCategories({ categories }: FooterCategoriesProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (title: string) =>
    setOpenSection((prev) => (prev === title ? null : title));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
      {categories.map((category) => {
        const isOpen = openSection === category.title;
        return (
          <div
            key={category.title}
            className="border-b border-matt-black-200/50 last:border-b-0 md:border-b-0 pb-4 last:pb-0 md:pb-0"
          >
            {/* Section header — clickable on mobile, static on desktop */}
            <button
              onClick={() => toggle(category.title)}
              className="w-full flex items-center justify-between text-left md:pointer-events-none focus:outline-none py-1 md:py-0"
              aria-expanded={isOpen}
            >
              <h4 className="text-sunflower-100 font-bold text-base md:text-[17px] tracking-wide w-full flex items-center justify-between">
                {category.title}
                <ChevronDown
                  className={`w-5 h-5 md:hidden transition-transform duration-300 ${isOpen
                      ? "rotate-180 text-sunflower-100"
                      : "text-white-chalk-400"
                    }`}
                />
              </h4>
            </button>

            {/* Links list */}
            <ul
              className={`mt-4 space-y-2.5 md:block ${isOpen ? "block" : "hidden"
                }`}
            >
              {category.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group/item flex items-start gap-1 text-sm text-matt-black-400 hover:text-sunflower-100 transition-all duration-200 hover:translate-x-1"
                  >
                    <span className="text-sunflower-100/40 group-hover/item:text-sunflower-100 transition-colors font-medium text-xs leading-5">
                      -
                    </span>
                    <span className="leading-relaxed">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
