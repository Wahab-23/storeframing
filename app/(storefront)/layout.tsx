import React from "react";
import Header from "@/components/storefront/base/header/Header";
import Footer from "@/components/storefront/base/footer/Footer";
import { CartProvider } from "@/lib/cart/CartContext";
import { WishlistProvider } from "@/lib/wishlist/WishlistContext";
import { SideCart } from "@/components/storefront/base/cart/SideCart";
import { SideWishlist } from "@/components/storefront/base/wishlist/SideWishlist";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="grow">{children}</main>
          <Footer />
          <SideCart />
          <SideWishlist />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
