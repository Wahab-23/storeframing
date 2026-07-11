import { HeaderData } from "./types";

export const defaultHeaderData: HeaderData = {
  logo: {
    src: "/company-identity/iShopping-logo-white.png",
    alt: "iShopping Logo",
    width: 140,
    height: 40,
  },
  actions: [
    {
      icon: "user",
      label: "Sign in",
      href: "/auth/sign-in",
    },
    {
      icon: "heart",
      label: "Wishlist",
      href: "/wishlist",
    },
    {
      icon: "shopping-cart",
      label: "Cart",
      href: "/cart",
      badge: 0,
    },
  ],
  navigation: [
    {
      label: "Electronics",
      href: "/electronics",
      subcategories: [
        {
          label: "TV & Video",
          href: "/electronics/tv-video",
          links: [
            { label: "All in TV & Video", href: "/electronics/tv-video" },
            { label: "LED TVs", href: "/electronics/tv-video/led-tvs" },
            { label: "Premium 4K TVs", href: "/electronics/tv-video/4k-tvs" },
            { label: "Projectors", href: "/electronics/tv-video/projectors" },
            { label: "Blu-Ray & DVD Players", href: "/electronics/tv-video/blu-ray-dvd" },
            { label: "Streaming Devices", href: "/electronics/tv-video/streaming-devices" },
            { label: "TV Accessories", href: "/electronics/tv-video/tv-accessories" },
          ],
        },
        {
          label: "Camera, Photo & Video",
          href: "/electronics/cameras",
          links: [
            { label: "DSLR Cameras", href: "/electronics/cameras/dslr" },
            { label: "Mirrorless Cameras", href: "/electronics/cameras/mirrorless" },
            { label: "Action Cameras", href: "/electronics/cameras/action-cameras" },
            { label: "Camera Lenses", href: "/electronics/cameras/lenses" },
            { label: "Tripods & Mounts", href: "/electronics/cameras/tripods" },
          ],
        },
        {
          label: "Home Audio & Theater",
          href: "/electronics/audio",
          links: [
            { label: "Soundbars", href: "/electronics/audio/soundbars" },
            { label: "Home Theater Systems", href: "/electronics/audio/home-theater" },
            { label: "Speakers", href: "/electronics/audio/speakers" },
            { label: "Amplifiers", href: "/electronics/audio/amplifiers" },
            { label: "AV Receivers", href: "/electronics/audio/av-receivers" },
          ],
        },
        {
          label: "VR & Glasses",
          href: "/electronics/vr",
          links: [
            { label: "VR Headsets", href: "/electronics/vr/headsets" },
            { label: "Smart Glasses", href: "/electronics/vr/smart-glasses" },
            { label: "VR Accessories", href: "/electronics/vr/accessories" },
          ],
        },
        {
          label: "Wearable",
          href: "/electronics/wearable",
          links: [
            { label: "Smart Watches", href: "/electronics/wearable/smart-watches" },
            { label: "Fitness Trackers", href: "/electronics/wearable/fitness-trackers" },
            { label: "Smart Rings", href: "/electronics/wearable/smart-rings" },
          ],
        },
        {
          label: "Headphones & Earbuds",
          href: "/electronics/headphones",
          links: [
            { label: "Wireless Earbuds", href: "/electronics/headphones/wireless-earbuds" },
            { label: "Over-Ear Headphones", href: "/electronics/headphones/over-ear" },
            { label: "Noise Cancelling", href: "/electronics/headphones/noise-cancelling" },
            { label: "Gaming Headsets", href: "/electronics/headphones/gaming" },
          ],
        },
        {
          label: "Accessories & Supplies",
          href: "/electronics/accessories",
          links: [
            { label: "Cables & Adapters", href: "/electronics/accessories/cables" },
            { label: "Power Banks", href: "/electronics/accessories/power-banks" },
            { label: "Chargers", href: "/electronics/accessories/chargers" },
            { label: "Memory Cards", href: "/electronics/accessories/memory-cards" },
          ],
        },
      ],
      brands: [
        { name: "Samsung", logo: "/brands/samsung.png", href: "/brands/samsung" },
        { name: "LG", logo: "/brands/lg.png", href: "/brands/lg" },
        { name: "Sony", logo: "/brands/sony.png", href: "/brands/sony" },
        { name: "TCL", logo: "/brands/tcl.png", href: "/brands/tcl" },
      ],
    },
    {
      label: "Mobiles & Tablets",
      href: "/mobiles-tablets",
      subcategories: [
        {
          label: "Smartphones",
          href: "/mobiles-tablets/smartphones",
          links: [
            { label: "All Smartphones", href: "/mobiles-tablets/smartphones" },
            { label: "Android Phones", href: "/mobiles-tablets/smartphones/android" },
            { label: "iPhones", href: "/mobiles-tablets/smartphones/iphones" },
            { label: "Budget Phones", href: "/mobiles-tablets/smartphones/budget" },
            { label: "Flagship Phones", href: "/mobiles-tablets/smartphones/flagship" },
          ],
        },
        {
          label: "Tablets",
          href: "/mobiles-tablets/tablets",
          links: [
            { label: "iPads", href: "/mobiles-tablets/tablets/ipads" },
            { label: "Android Tablets", href: "/mobiles-tablets/tablets/android" },
            { label: "E-Readers", href: "/mobiles-tablets/tablets/e-readers" },
            { label: "Tablet Accessories", href: "/mobiles-tablets/tablets/accessories" },
          ],
        },
        {
          label: "Mobile Accessories",
          href: "/mobiles-tablets/accessories",
          links: [
            { label: "Phone Cases", href: "/mobiles-tablets/accessories/cases" },
            { label: "Screen Protectors", href: "/mobiles-tablets/accessories/screen-protectors" },
            { label: "Chargers & Cables", href: "/mobiles-tablets/accessories/chargers" },
            { label: "Phone Holders", href: "/mobiles-tablets/accessories/holders" },
          ],
        },
      ],
      brands: [
        { name: "Apple", logo: "/brands/apple.png", href: "/brands/apple" },
        { name: "Samsung", logo: "/brands/samsung.png", href: "/brands/samsung" },
        { name: "Xiaomi", logo: "/brands/xiaomi.png", href: "/brands/xiaomi" },
        { name: "OnePlus", logo: "/brands/oneplus.png", href: "/brands/oneplus" },
      ],
    },
    {
      label: "Computer & Gaming",
      href: "/computer-gaming",
      subcategories: [
        {
          label: "Laptops",
          href: "/computer-gaming/laptops",
          links: [
            { label: "Gaming Laptops", href: "/computer-gaming/laptops/gaming" },
            { label: "Business Laptops", href: "/computer-gaming/laptops/business" },
            { label: "Ultrabooks", href: "/computer-gaming/laptops/ultrabooks" },
            { label: "MacBooks", href: "/computer-gaming/laptops/macbooks" },
          ],
        },
        {
          label: "Desktops & Monitors",
          href: "/computer-gaming/desktops",
          links: [
            { label: "Gaming PCs", href: "/computer-gaming/desktops/gaming" },
            { label: "All-in-One PCs", href: "/computer-gaming/desktops/all-in-one" },
            { label: "Monitors", href: "/computer-gaming/desktops/monitors" },
            { label: "Gaming Monitors", href: "/computer-gaming/desktops/gaming-monitors" },
          ],
        },
        {
          label: "Gaming Consoles",
          href: "/computer-gaming/consoles",
          links: [
            { label: "PlayStation", href: "/computer-gaming/consoles/playstation" },
            { label: "Xbox", href: "/computer-gaming/consoles/xbox" },
            { label: "Nintendo Switch", href: "/computer-gaming/consoles/nintendo" },
            { label: "Video Games", href: "/computer-gaming/consoles/games" },
          ],
        },
        {
          label: "Components",
          href: "/computer-gaming/components",
          links: [
            { label: "Graphics Cards", href: "/computer-gaming/components/graphics-cards" },
            { label: "Processors", href: "/computer-gaming/components/processors" },
            { label: "RAM", href: "/computer-gaming/components/ram" },
            { label: "Storage (SSD/HDD)", href: "/computer-gaming/components/storage" },
            { label: "Motherboards", href: "/computer-gaming/components/motherboards" },
          ],
        },
        {
          label: "Peripherals",
          href: "/computer-gaming/peripherals",
          links: [
            { label: "Keyboards", href: "/computer-gaming/peripherals/keyboards" },
            { label: "Gaming Mouse", href: "/computer-gaming/peripherals/mouse" },
            { label: "Mousepads", href: "/computer-gaming/peripherals/mousepads" },
            { label: "Webcams", href: "/computer-gaming/peripherals/webcams" },
          ],
        },
      ],
      brands: [
        { name: "ASUS", logo: "/brands/asus.png", href: "/brands/asus" },
        { name: "HP", logo: "/brands/hp.png", href: "/brands/hp" },
        { name: "Dell", logo: "/brands/dell.png", href: "/brands/dell" },
        { name: "Lenovo", logo: "/brands/lenovo.png", href: "/brands/lenovo" },
      ],
    },
    {
      label: "Home & Living",
      href: "/home-living",
      subcategories: [
        {
          label: "Kitchen Appliances",
          href: "/home-living/kitchen",
          links: [
            { label: "Blenders & Juicers", href: "/home-living/kitchen/blenders" },
            { label: "Microwave Ovens", href: "/home-living/kitchen/microwaves" },
            { label: "Air Fryers", href: "/home-living/kitchen/air-fryers" },
            { label: "Coffee Machines", href: "/home-living/kitchen/coffee-machines" },
          ],
        },
        {
          label: "Home Appliances",
          href: "/home-living/appliances",
          links: [
            { label: "Washing Machines", href: "/home-living/appliances/washing-machines" },
            { label: "Air Conditioners", href: "/home-living/appliances/air-conditioners" },
            { label: "Refrigerators", href: "/home-living/appliances/refrigerators" },
            { label: "Vacuum Cleaners", href: "/home-living/appliances/vacuum-cleaners" },
          ],
        },
        {
          label: "Furniture",
          href: "/home-living/furniture",
          links: [
            { label: "Beds & Mattresses", href: "/home-living/furniture/beds" },
            { label: "Sofas", href: "/home-living/furniture/sofas" },
            { label: "Office Chairs", href: "/home-living/furniture/office-chairs" },
            { label: "Tables & Desks", href: "/home-living/furniture/tables" },
          ],
        },
        {
          label: "Home Décor",
          href: "/home-living/decor",
          links: [
            { label: "Wall Art", href: "/home-living/decor/wall-art" },
            { label: "Lighting", href: "/home-living/decor/lighting" },
            { label: "Rugs & Carpets", href: "/home-living/decor/rugs" },
            { label: "Cushions & Throws", href: "/home-living/decor/cushions" },
          ],
        },
      ],
    },
    {
      label: "Men's Fashion",
      href: "/mens-fashion",
      subcategories: [
        {
          label: "Clothing",
          href: "/mens-fashion/clothing",
          links: [
            { label: "T-Shirts & Polos", href: "/mens-fashion/clothing/t-shirts" },
            { label: "Shirts", href: "/mens-fashion/clothing/shirts" },
            { label: "Jackets & Coats", href: "/mens-fashion/clothing/jackets" },
            { label: "Jeans & Trousers", href: "/mens-fashion/clothing/jeans" },
            { label: "Hoodies & Sweatshirts", href: "/mens-fashion/clothing/hoodies" },
          ],
        },
        {
          label: "Footwear",
          href: "/mens-fashion/footwear",
          links: [
            { label: "Sneakers", href: "/mens-fashion/footwear/sneakers" },
            { label: "Formal Shoes", href: "/mens-fashion/footwear/formal" },
            { label: "Sandals", href: "/mens-fashion/footwear/sandals" },
            { label: "Peshawari Chappal", href: "/mens-fashion/footwear/peshawari" },
          ],
        },
        {
          label: "Accessories",
          href: "/mens-fashion/accessories",
          links: [
            { label: "Watches", href: "/mens-fashion/accessories/watches" },
            { label: "Sunglasses", href: "/mens-fashion/accessories/sunglasses" },
            { label: "Wallets", href: "/mens-fashion/accessories/wallets" },
            { label: "Belts", href: "/mens-fashion/accessories/belts" },
          ],
        },
      ],
    },
    {
      label: "Women's Fashion",
      href: "/womens-fashion",
      subcategories: [
        {
          label: "Clothing",
          href: "/womens-fashion/clothing",
          links: [
            { label: "Kurtis & Tunics", href: "/womens-fashion/clothing/kurtis" },
            { label: "Unstitched Fabric", href: "/womens-fashion/clothing/unstitched" },
            { label: "Abayas & Hijabs", href: "/womens-fashion/clothing/abayas" },
            { label: "Western Wear", href: "/womens-fashion/clothing/western" },
          ],
        },
        {
          label: "Handbags & Clutches",
          href: "/womens-fashion/bags",
          links: [
            { label: "Shoulder Bags", href: "/womens-fashion/bags/shoulder" },
            { label: "Tote Bags", href: "/womens-fashion/bags/tote" },
            { label: "Clutches", href: "/womens-fashion/bags/clutches" },
            { label: "Backpacks", href: "/womens-fashion/bags/backpacks" },
          ],
        },
        {
          label: "Jewellery",
          href: "/womens-fashion/jewellery",
          links: [
            { label: "Necklaces", href: "/womens-fashion/jewellery/necklaces" },
            { label: "Earrings", href: "/womens-fashion/jewellery/earrings" },
            { label: "Bracelets & Bangles", href: "/womens-fashion/jewellery/bracelets" },
            { label: "Rings", href: "/womens-fashion/jewellery/rings" },
          ],
        },
        {
          label: "Footwear",
          href: "/womens-fashion/footwear",
          links: [
            { label: "Heels", href: "/womens-fashion/footwear/heels" },
            { label: "Flats & Khussa", href: "/womens-fashion/footwear/flats" },
            { label: "Sandals", href: "/womens-fashion/footwear/sandals" },
            { label: "Sneakers", href: "/womens-fashion/footwear/sneakers" },
          ],
        },
      ],
    },
    {
      label: "Beauty & Fragrance",
      href: "/beauty-fragrance",
      subcategories: [
        {
          label: "Makeup",
          href: "/beauty-fragrance/makeup",
          links: [
            { label: "Lip Makeup", href: "/beauty-fragrance/makeup/lip" },
            { label: "Eye Makeup", href: "/beauty-fragrance/makeup/eye" },
            { label: "Face Makeup", href: "/beauty-fragrance/makeup/face" },
            { label: "Brush Sets", href: "/beauty-fragrance/makeup/brushes" },
            { label: "Nail Cosmetics", href: "/beauty-fragrance/makeup/nails" },
          ],
        },
        {
          label: "Skincare",
          href: "/beauty-fragrance/skincare",
          links: [
            { label: "Moisturizers", href: "/beauty-fragrance/skincare/moisturizers" },
            { label: "Serums", href: "/beauty-fragrance/skincare/serums" },
            { label: "Sunscreen", href: "/beauty-fragrance/skincare/sunscreen" },
            { label: "Face Wash", href: "/beauty-fragrance/skincare/face-wash" },
          ],
        },
        {
          label: "Fragrances",
          href: "/beauty-fragrance/fragrances",
          links: [
            { label: "Men's Perfumes", href: "/beauty-fragrance/fragrances/mens" },
            { label: "Women's Perfumes", href: "/beauty-fragrance/fragrances/womens" },
            { label: "Unisex Fragrances", href: "/beauty-fragrance/fragrances/unisex" },
            { label: "Body Mists", href: "/beauty-fragrance/fragrances/body-mists" },
          ],
        },
        {
          label: "Hair Care",
          href: "/beauty-fragrance/hair-care",
          links: [
            { label: "Shampoos", href: "/beauty-fragrance/hair-care/shampoos" },
            { label: "Hair Oils", href: "/beauty-fragrance/hair-care/oils" },
            { label: "Styling Tools", href: "/beauty-fragrance/hair-care/styling" },
            { label: "Hair Color", href: "/beauty-fragrance/hair-care/color" },
          ],
        },
      ],
    },
    {
      label: "Health & Nutrition",
      href: "/health-nutrition",
      subcategories: [
        {
          label: "Supplements",
          href: "/health-nutrition/supplements",
          links: [
            { label: "Vitamins", href: "/health-nutrition/supplements/vitamins" },
            { label: "Protein Powders", href: "/health-nutrition/supplements/protein" },
            { label: "Pre-Workout", href: "/health-nutrition/supplements/pre-workout" },
            { label: "Omega & Fish Oil", href: "/health-nutrition/supplements/omega" },
          ],
        },
        {
          label: "Personal Care",
          href: "/health-nutrition/personal-care",
          links: [
            { label: "Oral Care", href: "/health-nutrition/personal-care/oral" },
            { label: "Men's Grooming", href: "/health-nutrition/personal-care/mens-grooming" },
            { label: "Feminine Care", href: "/health-nutrition/personal-care/feminine" },
            { label: "Body Wash & Soaps", href: "/health-nutrition/personal-care/body-wash" },
          ],
        },
        {
          label: "Medical Supplies",
          href: "/health-nutrition/medical",
          links: [
            { label: "BP Monitors", href: "/health-nutrition/medical/bp-monitors" },
            { label: "Thermometers", href: "/health-nutrition/medical/thermometers" },
            { label: "First Aid", href: "/health-nutrition/medical/first-aid" },
            { label: "Masks & Sanitizers", href: "/health-nutrition/medical/masks" },
          ],
        },
        {
          label: "Fitness Equipment",
          href: "/health-nutrition/fitness",
          links: [
            { label: "Treadmills", href: "/health-nutrition/fitness/treadmills" },
            { label: "Dumbbells & Weights", href: "/health-nutrition/fitness/dumbbells" },
            { label: "Yoga Mats", href: "/health-nutrition/fitness/yoga-mats" },
            { label: "Resistance Bands", href: "/health-nutrition/fitness/resistance-bands" },
          ],
        },
      ],
    },
  ],
};
