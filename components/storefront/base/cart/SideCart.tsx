"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Tag,
} from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SideCart() {
  const {
    cart,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    totalItems,
    subtotal,
  } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);

  // Free shipping threshold logic (e.g. Free shipping over PKR 200,000)
  const FREE_SHIPPING_THRESHOLD = 200000;
  const progressToFreeShipping = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100
  );
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "STORE10") {
      setDiscountApplied(true);
    }
  };

  const calculatedDiscount = discountApplied ? subtotal * 0.1 : 0;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 490;
  const grandTotal = Math.max(0, subtotal - calculatedDiscount + shippingFee);

  if (!isOpen) return null;


  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-200 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Side Cart Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart Drawer"
        className="fixed top-0 right-0 bottom-0 z-201 flex flex-col w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out border-l border-neutral-100 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-sunflower-100/20 text-matt-black-100">
              <ShoppingBag className="w-5 h-5 stroke-2" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-matt-black-100 text-[10px] font-extrabold text-sunflower-100">
                  {totalItems}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-matt-black-100 leading-tight">
                Your Shopping Cart
              </h2>
              <p className="text-xs text-matt-black-400 font-medium">
                {totalItems === 0
                  ? "Cart is empty"
                  : `${totalItems} item${totalItems > 1 ? "s" : ""} selected`}
              </p>
            </div>
          </div>

          <button
            onClick={closeCart}
            aria-label="Close side cart"
            className="flex items-center justify-center w-9 h-9 rounded-full text-matt-black-300 hover:text-matt-black-100 hover:bg-neutral-100 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Banner */}
        <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-100">
          <div className="flex items-center justify-between text-xs font-semibold text-matt-black-200 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-munsell-blue-100" />
              {remainingForFreeShipping === 0 ? (
                <span className="text-pablano-100 font-bold">
                  🎉 You unlocked FREE Express Shipping!
                </span>
              ) : (
                <span>
                  Add <strong className="text-matt-black-100">{formatPrice(remainingForFreeShipping)}</strong> for Free Shipping
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold text-matt-black-300">
              {Math.round(progressToFreeShipping)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-sunflower-100 via-munsell-blue-100 to-pablano-100 transition-all duration-500 rounded-full"
              style={{ width: `${progressToFreeShipping}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 divide-y divide-neutral-100">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4 text-matt-black-400">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-matt-black-100 mb-1">
                Your cart feels empty
              </h3>
              <p className="text-sm text-matt-black-300 mb-6 max-w-65">
                Explore our collections and add your favorite items to your bag.
              </p>
              <button
                onClick={closeCart}
                className="px-6 py-3 rounded-xl bg-matt-black-100 hover:bg-matt-black-200 text-white font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const imageSrc =
                Array.isArray(item.product.image) && item.product.image.length > 0
                  ? item.product.image[0]
                  : "/product-images/firstImg.png";

              return (
                <div key={item.product.id} className="pt-4 first:pt-0 flex gap-4 group">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/60">
                    <Image
                      src={imageSrc}
                      alt={item.product.title}
                      fill
                      className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-matt-black-100 truncate hover:text-munsell-blue-100 transition-colors">
                          {item.product.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-neutral-400 hover:text-cadmium-red-100 transition-colors p-1 rounded hover:bg-neutral-100"
                          aria-label={`Remove ${item.product.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-matt-black-300 mt-0.5">
                        Seller: <span className="font-medium text-matt-black-200">{item.product.seller}</span>
                      </p>

                      {/* Variant Pills */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {item.selectedSize && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-matt-black-200">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-matt-black-200">
                            {item.selectedColor}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price and Quantity Control */}
                    <div className="flex items-center justify-between mt-3 pt-2">
                      <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50 overflow-hidden shadow-2xs">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-matt-black-300 hover:text-matt-black-100 hover:bg-neutral-200 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-matt-black-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-matt-black-300 hover:text-matt-black-100 hover:bg-neutral-200 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-matt-black-100">
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                        {item.product.oldPrice && (
                          <div className="text-[11px] text-matt-black-400 line-through">
                            {formatPrice(item.product.oldPrice * item.quantity)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Summary Area */}
        {cart.length > 0 && (
          <div className="border-t border-neutral-200 bg-white p-6 space-y-4 shadow-lg">
            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Promo code (e.g. STORE10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-neutral-200 rounded-lg focus:outline-none focus:border-matt-black-100 uppercase"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-matt-black-100 text-xs font-bold rounded-lg transition-colors"
              >
                Apply
              </button>
            </form>

            {discountApplied && (
              <div className="flex items-center justify-between text-xs text-pablano-100 font-medium bg-pablano-50 p-2 rounded-lg border border-pablano-200/40">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 10% Promo Discount Applied
                </span>
                <span>-{formatPrice(calculatedDiscount)}</span>
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-matt-black-300 pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-matt-black-100">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {discountApplied && (
                <div className="flex justify-between text-pablano-100">
                  <span>Discount</span>
                  <span>-{formatPrice(calculatedDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                {shippingFee === 0 ? (
                  <span className="font-bold text-pablano-100">FREE</span>
                ) : (
                  <span className="font-semibold text-matt-black-100">
                    {formatPrice(shippingFee)}
                  </span>
                )}
              </div>

              <div className="flex justify-between text-base font-extrabold text-matt-black-100 pt-2 border-t border-neutral-100">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Checkout CTAs */}
            <div className="space-y-2 pt-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-sunflower-100 hover:bg-sunflower-200 text-matt-black-100 font-extrabold text-sm tracking-wide transition-all shadow-md hover:shadow-lg transform active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={closeCart}
                className="w-full py-2.5 text-center text-xs font-semibold text-matt-black-300 hover:text-matt-black-100 transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            {/* Trust badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-pablano-100" />
              <span>100% Safe & Secure Checkout</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
