"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Product } from "@/components/storefront/product-card/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WishlistItem {
  product: Product;
  addedAt: number; // unix timestamp ms
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  isOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlist: () => void;
  toggleItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "sf_wishlist_v1";

function loadWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
  } catch {
    return [];
  }
}

function saveWishlist(items: WishlistItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private-mode errors
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useRef(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      setWishlist(loadWishlist());
    }
  }, []);

  // Persist on every change (after hydration)
  useEffect(() => {
    if (hydrated.current) {
      saveWishlist(wishlist);
    }
  }, [wishlist]);

  // Prevent background scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const openWishlist = () => setIsOpen(true);
  const closeWishlist = () => setIsOpen(false);
  const toggleWishlist = () => setIsOpen((prev) => !prev);

  const toggleItem = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((i) => i.product.id === product.id);
      if (exists) {
        // Remove
        return prev.filter((i) => i.product.id !== product.id);
      }
      // Add
      return [...prev, { product, addedAt: Date.now() }];
    });
    // Open the panel when adding
    setIsOpen(true);
  };

  const removeItem = (productId: string) => {
    setWishlist((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const isWishlisted = (productId: string) =>
    wishlist.some((i) => i.product.id === productId);

  const clearWishlist = () => setWishlist([]);

  const totalItems = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isOpen,
        openWishlist,
        closeWishlist,
        toggleWishlist,
        toggleItem,
        removeItem,
        isWishlisted,
        clearWishlist,
        totalItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
