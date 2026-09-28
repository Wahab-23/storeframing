"use client";

import React from "react";
import { Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ProductSeoCardProps {
  metaTitle: string;
  setMetaTitle: (val: string) => void;
  metaDescription: string;
  setMetaDescription: (val: string) => void;
  metaKeywords: string;
  setMetaKeywords: (val: string) => void;
  canonicalUrl: string;
  setCanonicalUrl: (val: string) => void;
  productName: string;
  slug: string;
  shortDesc?: string;
  disabled?: boolean;
}

export function ProductSeoCard({
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
  metaKeywords,
  setMetaKeywords,
  canonicalUrl,
  setCanonicalUrl,
  productName,
  slug,
  shortDesc = "",
  disabled = false,
}: ProductSeoCardProps) {
  const previewTitle = metaTitle.trim() || productName.trim() || "Product Title";
  const previewSlug = slug.trim() || "product-url-key";
  const previewDescription =
    metaDescription.trim() ||
    shortDesc.replace(/<[^>]*>?/gm, "").slice(0, 155) ||
    "Experience premium quality and fast delivery on StoreFraming catalog.";

  return (
    <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
        <Globe className="w-4 h-4 text-sunflower-100" />
        <h3 className="font-sora text-sm font-bold text-white-chalk-100">
          Search Engine Optimization (SEO Metadata)
        </h3>
      </div>

      {/* Live Google SERP Card Preview */}
      <div className="p-4 rounded-xl bg-matt-black-300/80 border border-white-chalk-100/10 space-y-1.5 shadow-inner">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white-chalk-100/40">
          Google Search Result Snippet Preview
        </p>
        <p className="text-xs font-mono text-[#8ab4f8] truncate cursor-pointer hover:underline">
          https://storeframing.com/products/{previewSlug}
        </p>
        <h4 className="text-base font-semibold text-[#8ab4f8] hover:underline cursor-pointer truncate">
          {previewTitle} | StoreFraming
        </h4>
        <p className="text-xs text-[#bdc1c6] line-clamp-2 leading-relaxed">
          {previewDescription}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="meta-title">Meta Title</Label>
            <span
              className={`text-[10px] font-mono ${
                metaTitle.length > 60 ? "text-cadmium-red-200" : "text-white-chalk-100/40"
              }`}
            >
              {metaTitle.length} / 60 chars
            </span>
          </div>
          <Input
            id="meta-title"
            type="text"
            disabled={disabled}
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Custom title for Google search listings"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="meta-description">Meta Description</Label>
            <span
              className={`text-[10px] font-mono ${
                metaDescription.length > 160 ? "text-cadmium-red-200" : "text-white-chalk-100/40"
              }`}
            >
              {metaDescription.length} / 160 chars
            </span>
          </div>
          <textarea
            id="meta-description"
            rows={3}
            disabled={disabled}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Summarize product value for search snippet click-throughs..."
            className="w-full bg-matt-black-200 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-md p-2.5 text-xs text-white-chalk-100 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="meta-keywords">Meta Keywords</Label>
            <Input
              id="meta-keywords"
              type="text"
              disabled={disabled}
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="e.g. noise-cancelling, headphones, wireless"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="canonical-url">Canonical URL</Label>
            <Input
              id="canonical-url"
              type="text"
              disabled={disabled}
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://storeframing.com/products/original-url"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
