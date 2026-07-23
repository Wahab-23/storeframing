import { HeroSection } from "@/components/storefront/hero/HeroSection";
import { ProductCarousel } from "@/components/storefront/carousel/ProductCarousel";
import { CategoryCarousel, Category } from "@/components/storefront/carousel/CategoryCarousel";
import { BrandsCarousel, Brand } from "@/components/storefront/carousel/BrandsCarousel";
import { Product } from "@/components/storefront/product-card/types";
import { FeaturesBanner } from "@/components/storefront/base/FeaturesBanner";
import { PromoBanner } from "@/components/storefront/base/PromoBanner";
import { TestimonialsCarousel, Testimonial } from "@/components/storefront/carousel/TestimonialsCarousel";

// ── Dummy Products ──────────────────────────────────────────────────────────

const DUMMY_PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "men-harrington-jacket",
    title: "Men Harrington Jacket Green",
    seller: "Al-Oasis Traders",
    image: ["/product-images/firstImg.png", "/product-images/secondImg.png", "/product-images/thirdImg.png"],
    tags: ["Best Seller"],
    price: 102000,
    oldPrice: 128000,
    discount: 20,
    rating: 4.7,
    reviews: 312,
    inStock: true,
    estDelivery: "2-4 working days",
  },
  {
    id: "2",
    slug: "slim-fit-chinos",
    title: "Slim Fit Chino Trousers Beige",
    seller: "UrbanWear PK",
    image: ["/product-images/firstImg.png"],
    tags: ["New Arrival"],
    price: 64500,
    oldPrice: 75000,
    discount: 14,
    rating: 4.4,
    reviews: 88,
    inStock: true,
    estDelivery: "3-5 working days",
  },
  {
    id: "3",
    slug: "cotton-polo-shirt",
    title: "Premium Cotton Polo Shirt Navy",
    seller: "ThreadCraft",
    image: ["/product-images/secondImg.png"],
    tags: ["Sale"],
    price: 36000,
    oldPrice: 50000,
    discount: 28,
    rating: 4.6,
    reviews: 201,
    inStock: true,
    estDelivery: "1-3 working days",
  },
  {
    id: "4",
    slug: "leather-chelsea-boots",
    title: "Genuine Leather Chelsea Boots",
    seller: "Footprint PK",
    image: ["/product-images/thirdImg.png"],
    tags: ["Premium"],
    price: 215000,
    oldPrice: 260000,
    discount: 17,
    rating: 4.9,
    reviews: 57,
    inStock: false,
    estDelivery: "5-7 working days",
  },
  {
    id: "5",
    slug: "oversized-graphic-tee",
    title: "Oversized Graphic Tee White",
    seller: "StreetStyle Co",
    image: ["/product-images/firstImg.png", "/product-images/secondImg.png"],
    tags: ["Trending"],
    price: 28000,
    rating: 4.2,
    reviews: 430,
    inStock: true,
    estDelivery: "2-3 working days",
  },
  {
    id: "6",
    slug: "denim-jacket-washed",
    title: "Washed Denim Trucker Jacket",
    seller: "Denim Studio",
    image: ["/product-images/secondImg.png", "/product-images/thirdImg.png"],
    tags: ["Best Seller"],
    price: 89000,
    oldPrice: 110000,
    discount: 19,
    rating: 4.5,
    reviews: 174,
    inStock: true,
    estDelivery: "2-4 working days",
  },
  {
    id: "7",
    slug: "linen-summer-shirt",
    title: "Linen Summer Casual Shirt Sky",
    seller: "Breeze Fashion",
    image: ["/product-images/thirdImg.png"],
    tags: ["New Arrival"],
    price: 45000,
    oldPrice: 55000,
    discount: 18,
    rating: 4.3,
    reviews: 93,
    inStock: true,
    estDelivery: "3-5 working days",
  },
  {
    id: "8",
    slug: "formal-dress-shirt-white",
    title: "Classic Formal Dress Shirt White",
    seller: "Executive Wear",
    image: ["/product-images/firstImg.png"],
    tags: ["Premium"],
    price: 55000,
    rating: 4.8,
    reviews: 260,
    inStock: true,
    estDelivery: "1-3 working days",
  },
];

// ── Dummy Categories ────────────────────────────────────────────────────────

const DUMMY_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Men's Fashion",
    slug: "mens-fashion",
    image: "/product-images/firstImg.png",
    itemCount: 2847,
    accentColor: "#059BB5",
  },
  {
    id: "cat-2",
    name: "Women's Wear",
    slug: "womens-wear",
    image: "/product-images/secondImg.png",
    itemCount: 3412,
    accentColor: "#DE0425",
  },
  {
    id: "cat-3",
    name: "Footwear",
    slug: "footwear",
    image: "/product-images/thirdImg.png",
    itemCount: 1284,
    accentColor: "#118217",
  },
  {
    id: "cat-4",
    name: "Accessories",
    slug: "accessories",
    image: "/product-images/firstImg.png",
    itemCount: 964,
    accentColor: "#FCC014",
  },
  {
    id: "cat-5",
    name: "Kids' Clothing",
    slug: "kids-clothing",
    image: "/product-images/secondImg.png",
    itemCount: 1731,
    accentColor: "#059BB5",
  },
  {
    id: "cat-6",
    name: "Sportswear",
    slug: "sportswear",
    image: "/product-images/thirdImg.png",
    itemCount: 892,
    accentColor: "#118217",
  },
  {
    id: "cat-7",
    name: "Outerwear",
    slug: "outerwear",
    image: "/product-images/firstImg.png",
    itemCount: 543,
    accentColor: "#171515",
  },
  {
    id: "cat-8",
    name: "Formals",
    slug: "formals",
    image: "/product-images/secondImg.png",
    itemCount: 1108,
    accentColor: "#323030",
  },
];

// ── Dummy Brands ────────────────────────────────────────────────────────────

const DUMMY_BRANDS: Brand[] = [
  { id: "b-1", name: "Levi's", slug: "levis", logo: "/product-images/firstImg.png", tagline: "Original Jeans" },
  { id: "b-2", name: "Nike", slug: "nike", logo: "/product-images/secondImg.png", tagline: "Just Do It" },
  { id: "b-3", name: "Adidas", slug: "adidas", logo: "/product-images/thirdImg.png", tagline: "Impossible is Nothing" },
  { id: "b-4", name: "Bonanza", slug: "bonanza", logo: "/product-images/firstImg.png", tagline: "Pakistan's Own" },
  { id: "b-5", name: "Gul Ahmed", slug: "gul-ahmed", logo: "/product-images/secondImg.png", tagline: "Premium Fabric" },
  { id: "b-6", name: "Khaadi", slug: "khaadi", logo: "/product-images/thirdImg.png", tagline: "Wear the Craft" },
  { id: "b-7", name: "Outfitters", slug: "outfitters", logo: "/product-images/firstImg.png", tagline: "Urban Style" },
  { id: "b-8", name: "Sapphire", slug: "sapphire", logo: "/product-images/secondImg.png", tagline: "Dress to Impress" },
  { id: "b-9", name: "Bareeze", slug: "bareeze", logo: "/product-images/thirdImg.png", tagline: "Luxury Lawn" },
  { id: "b-10", name: "Ideas", slug: "ideas", logo: "/product-images/firstImg.png", tagline: "Everyday Essentials" },
];

// ── Dummy Testimonials ──────────────────────────────────────────────────────

const DUMMY_TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    name: "Sarah Ahmed",
    role: "Verified Buyer",
    avatar: "/product-images/firstImg.png", // Using existing dummy image for avatar
    rating: 5,
    text: "Absolutely love the quality of the clothes! The shipping was surprisingly fast, and the packaging felt very premium. Will definitely shop here again.",
  },
  {
    id: "t-2",
    name: "Zain Bukhari",
    role: "Verified Buyer",
    avatar: "/product-images/secondImg.png",
    rating: 4,
    text: "Great selection of brands all in one place. The customer service team was very helpful when I needed to exchange a size. Highly recommended.",
  },
  {
    id: "t-3",
    name: "Aisha Khan",
    role: "Verified Buyer",
    avatar: "/product-images/thirdImg.png",
    rating: 5,
    text: "Storeframing makes finding the latest fashion trends so easy. I've bought three outfits this month alone and they all fit perfectly.",
  },
  {
    id: "t-4",
    name: "Omar Tariq",
    role: "Verified Buyer",
    avatar: "/product-images/firstImg.png",
    rating: 5,
    text: "The checkout process is seamless and secure. I appreciate the detailed product descriptions and size guides. A very trustworthy platform.",
  },
  {
    id: "t-5",
    name: "Fatima Ali",
    role: "Verified Buyer",
    avatar: "/product-images/secondImg.png",
    rating: 4,
    text: "Good collection, especially the formal wear section. The delivery was exactly on the promised date.",
  },
];

// ── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <HeroSection />

      {/* Trust Builders */}
      {/* <FeaturesBanner /> */}

      {/* Category Carousel */}
      <CategoryCarousel
        title="Shop by Category"
        subtitle="Explore Our Collection"
        categories={DUMMY_CATEGORIES}
        viewAllHref="/categories"
      />

      {/* Promotional Banner */}
      <PromoBanner
        title="Summer Clearance Sale"
        subtitle="Up to 50% Off"
        description="Refresh your wardrobe with our latest summer collection. Discover breathable fabrics and vibrant colors."
        ctaText="Shop The Sale"
        ctaHref="/sale"
        imageSrc="/product-images/firstImg.png"
        imageAlt="Summer clothing on models"
      />

      {/* Product Carousel — Featured */}
      <div className="bg-white-chalk-200 mt-10 md:mt-14">
        <ProductCarousel
          title="Featured Products"
          subtitle="Handpicked for You"
          products={DUMMY_PRODUCTS}
          viewAllHref="/products"
          accentColor="#FCC014" // sunflower-100
        />
      </div>

      {/* Product Carousel — New Arrivals */}
      <ProductCarousel
        title="New Arrivals"
        subtitle="Just Dropped"
        products={[...DUMMY_PRODUCTS].reverse()}
        viewAllHref="/products?sort=newest"
        accentColor="#059BB5" // munsell-blue-100
      />

      {/* Brands Carousel */}
      <div className="bg-white-chalk-200 border-t border-matt-black-500/30">
        <BrandsCarousel
          title="Top Brands"
          subtitle="Trusted By Millions"
          brands={DUMMY_BRANDS}
        />
      </div>

      {/* Testimonials Carousel */}
      <div className="mb-8 md:mb-16">
        <TestimonialsCarousel
          title="What Our Customers Say"
          subtitle="Real Reviews"
          testimonials={DUMMY_TESTIMONIALS}
        />
      </div>
    </div>
  );
}
