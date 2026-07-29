"use client";

import Image from "next/image";
import { X, Heart, Trash2, ShoppingCart, ArrowRight, Sparkles } from "lucide-react";
import { useWishlist } from "@/lib/wishlist/WishlistContext";
import { useCart } from "@/components/storefront/base/cart/CartContext";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SideWishlist() {
  const { wishlist, isOpen, closeWishlist, removeItem, clearWishlist, totalItems } =
    useWishlist();
  const { addToCart, cart } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-200 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeWishlist}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist Drawer"
        className="fixed top-0 right-0 bottom-0 z-201 flex flex-col w-full max-w-md bg-white shadow-2xl border-l border-neutral-100 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cadmium-red-500/60 text-cadmium-red-100">
              <Heart className="w-5 h-5 fill-cadmium-red-100 stroke-none" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-matt-black-100 leading-tight">
                Your Wishlist
              </h2>
              <p className="text-xs text-matt-black-400 font-medium">
                {totalItems === 0
                  ? "Nothing saved yet"
                  : `${totalItems} item${totalItems > 1 ? "s" : ""} saved`}
              </p>
            </div>
          </div>

          <button
            onClick={closeWishlist}
            aria-label="Close wishlist"
            className="flex items-center justify-center w-9 h-9 rounded-full text-matt-black-300 hover:text-matt-black-100 hover:bg-neutral-100 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 divide-y divide-neutral-100">
          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 stroke-[1.5] text-matt-black-400" />
              </div>
              <h3 className="text-lg font-bold text-matt-black-100 mb-1">
                Your wishlist is empty
              </h3>
              <p className="text-sm text-matt-black-300 mb-6 max-w-65">
                Tap the heart icon on any product to save it for later.
              </p>
              <button
                onClick={closeWishlist}
                className="px-6 py-3 rounded-xl bg-matt-black-100 hover:bg-matt-black-200 text-white font-semibold text-sm transition-all duration-200 shadow-sm"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            wishlist.map(({ product }) => {
              const imageSrc =
                Array.isArray(product.image) && product.image.length > 0
                  ? product.image[0]
                  : "/product-images/firstImg.png";

              const inCart = cart.some((i) => i.product.id === product.id);

              return (
                <div key={product.id} className="pt-4 first:pt-0 flex gap-4 group">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/60">
                    <Image
                      src={imageSrc}
                      alt={product.title}
                      fill
                      className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.discount && (
                      <span className="absolute top-1 left-1 bg-cadmium-red-100 text-white text-[9px] font-extrabold px-1 py-0.5 rounded">
                        -{product.discount}%
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-matt-black-100 line-clamp-2 hover:text-munsell-blue-100 transition-colors">
                          {product.title}
                        </h4>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="text-neutral-400 hover:text-cadmium-red-100 transition-colors p-1 rounded hover:bg-neutral-100 shrink-0"
                          aria-label={`Remove ${product.title} from wishlist`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-matt-black-300 mt-0.5">
                        by{" "}
                        <span className="font-medium text-matt-black-200">
                          {product.seller}
                        </span>
                      </p>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-sm font-extrabold text-matt-black-100">
                          {formatPrice(product.price)}
                        </span>
                        {product.oldPrice && (
                          <span className="text-xs text-matt-black-400 line-through">
                            {formatPrice(product.oldPrice)}
                          </span>
                        )}
                      </div>

                      {/* Stock */}
                      {product.inStock === false && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-cadmium-red-100 bg-cadmium-red-500/50 px-2 py-0.5 rounded">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Move to Cart CTA */}
                    <button
                      onClick={() => {
                        if (product.inStock !== false) {
                          addToCart(product);
                          removeItem(product.id);
                        }
                      }}
                      disabled={product.inStock === false}
                      className={`
                        mt-3 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 border
                        ${inCart
                          ? "border-pablano-200 bg-pablano-500/40 text-pablano-100 cursor-default"
                          : product.inStock === false
                            ? "border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed"
                            : "border-matt-black-100 bg-matt-black-100 text-sunflower-100 hover:bg-matt-black-200 shadow-sm"
                        }
                      `}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {inCart ? "Already in Cart" : product.inStock === false ? "Unavailable" : "Move to Cart"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div className="border-t border-neutral-200 bg-white p-6 space-y-3">
            {/* Move all to cart */}
            <button
              onClick={() => {
                wishlist
                  .filter((i) => i.product.inStock !== false)
                  .forEach((i) => addToCart(i.product));
                clearWishlist();
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-sunflower-100 hover:bg-sunflower-200 text-matt-black-100 font-extrabold text-sm tracking-wide transition-all shadow-md hover:shadow-lg transform active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Move All to Cart</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={clearWishlist}
              className="w-full py-2.5 text-center text-xs font-semibold text-matt-black-300 hover:text-cadmium-red-100 transition-colors"
            >
              Clear Wishlist
            </button>
          </div>
        )}
      </div>
    </>
  );
}
