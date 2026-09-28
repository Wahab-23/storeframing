"use client";

import React from "react";
import {
  Package,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Boxes,
  Globe,
  Store,
  History,
  AlertCircle,
  LucideIcon,
} from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const PRODUCT_FORM_TABS: TabItem[] = [
  { id: "general", label: "Basics", description: "Name, brand, type, and categories", icon: Package },
  { id: "content", label: "Description", description: "Product copy and details", icon: FileText },
  { id: "images", label: "Photos & media", description: "Images and alt text", icon: ImageIcon },
  { id: "pricing", label: "Pricing & stock", description: "Seller offer setup", icon: DollarSign },
  { id: "configurations", label: "Variants", description: "Options and variant SKUs", icon: Boxes },
  { id: "seo", label: "Search preview", description: "Search title and metadata", icon: Globe },
  { id: "marketplace", label: "Seller access", description: "Ownership and merchant offers", icon: Store },
  { id: "history", label: "History", description: "Revisions and recorded events", icon: History },
];

export interface ProductFormTabsNavProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  showHistoryTab?: boolean;
  imagesCount?: number;
  listingsCount?: number;
  revisionNumber?: number;
  hasNameError?: boolean;
  hasCategoryError?: boolean;
}

export function ProductFormTabsNav({
  activeTab,
  setActiveTab,
  showHistoryTab = true,
  imagesCount = 0,
  listingsCount = 0,
  revisionNumber,
  hasNameError = false,
  hasCategoryError = false,
}: ProductFormTabsNavProps) {
  const tabs = PRODUCT_FORM_TABS.filter(
    (t) => t.id !== "history" || showHistoryTab
  );

  return (
    <nav className="space-y-1">
      <div className="px-2 pb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-white-chalk-100/40">
        <span>Navigation Tabs</span>
      </div>
      <div className="space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isWarning =
            tab.id === "general" && (hasNameError || hasCategoryError);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? "step" : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                isActive
                  ? "bg-sunflower-100 text-matt-black-100 font-bold shadow-md shadow-sunflower-100/10"
                  : "text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-white-chalk-100/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>
                  <span className="block text-xs font-semibold">{tab.label}</span>
                  <span
                    className={`block mt-0.5 text-[10px] font-normal ${
                      isActive ? "text-matt-black-100/70" : "text-white-chalk-100/40"
                    }`}
                  >
                    {tab.description}
                  </span>
                </span>
              </div>

              {isWarning && !isActive && (
                <span className="inline-flex items-center text-cadmium-red-200" title="Missing required fields">
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              )}

              {tab.id === "images" && imagesCount > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-matt-black-100 text-white-chalk-100" : "bg-white-chalk-100/10 text-white-chalk-100/60"
                  }`}
                >
                  {imagesCount}
                </span>
              )}

              {tab.id === "marketplace" && listingsCount > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-matt-black-100 text-white-chalk-100" : "bg-sunflower-100/20 text-sunflower-100"
                  }`}
                >
                  {listingsCount}
                </span>
              )}

              {tab.id === "history" && revisionNumber !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-matt-black-100 text-white-chalk-100" : "bg-munsell-blue-100/20 text-munsell-blue-100"
                  }`}
                >
                  v{revisionNumber}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
