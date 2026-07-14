import { ProductCard } from "@/components/storefront/product-card/ProductCard";
import { HeroSection } from "@/components/storefront/hero/HeroSection";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection />
      {/* Product Section */}
      <div className="flex flex-col items-center justify-center py-16" >
        <h1>Product Section</h1>
        {/* product card */}
        <div className="grid w-full">
          <div className="flex items-center justify-center w-full gap-4 p-2 flex-wrap">
            <ProductCard
              product={{
                id: "1",
                slug: "men-harrington-jacket",
                title: "Men Harrington Jacket Green",
                seller: "Al-Oasis Traders",
                image: ["/product-images/firstImg.png", "/product-images/secondImg.png", "/product-images/thirdImg.png"],
                tags: ["In Stock", "Best Seller"],
                price: 102000,
                oldPrice: 128000,
                discount: 12,
                rating: 4.7,
                reviews: 23,
                inStock: true,
                estDelivery: "2-4 working days",
              }}
            />
          </div>
        </div>
      </div>
      {/* Testimonial Section */}
      <div className="flex flex-col items-center justify-center py-16" >
        <h1>Testimonial Section</h1>
        <div>
          {/* testimonial card */}
          <div>
            <p>Testimonial</p>
            <p>Testimonial Author</p>
          </div>
        </div>
      </div>
    </div>
  );
}
