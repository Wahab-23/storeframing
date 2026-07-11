import { FooterData } from "./types";

export const defaultFooterData: FooterData = {
  logo: {
    src: "/company-identity/iShopping-logo-white.png",
    alt: "iShopping Logo",
    width: 140,
    height: 40,
  },
  contacts: [
    {
      icon: "phone",
      label: "Call Support",
      value: "021-111-222-202",
      href: "tel:021111222202",
    },
    {
      icon: "whatsapp",
      label: "WhatsApp Sales",
      value: "+92-328-2898-807",
      href: "https://wa.me/923282898807",
    },
    {
      icon: "mail",
      label: "Email Inquiries",
      value: "support@ishopping.pk",
      href: "mailto:support@ishopping.pk",
    },
  ],
  valueProps: [
    {
      icon: "truck",
      title: "Countrywide Shipping",
      description: "More than 100 cities and regions.",
    },
    {
      icon: "banknote",
      title: "Great Value",
      description: "Competitive prices on 200K+ products.",
    },
    {
      icon: "headphones",
      title: "Expert Support",
      description: "For a smooth shopping experience.",
    },
    {
      icon: "thumbsup",
      title: "10/10 Satisfaction",
      description: "Rated 5/5 by thousands of customers.",
    },
  ],
  categories: [
    {
      title: "iShopping",
      links: [
        { label: "About Us", href: "/about-us" },
        { label: "Sell With Us", href: "/sell-with-us" },
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms & Conditions", href: "/terms-conditions" },
        { label: "Warranty Policy", href: "/warranty-policy" },
      ],
    },
    {
      title: "Need Help ?",
      links: [
        { label: "Contact Us", href: "/contact-us" },
        { label: "Careers", href: "/careers" },
        { label: "iBlogs", href: "/blogs" },
        { label: "Giftcards", href: "/giftcards" },
        { label: "Track Order", href: "/track-order" },
      ],
    },
    {
      title: "Gaming",
      links: [
        { label: "Video Games", href: "/gaming/video-games" },
        { label: "Gaming Consoles", href: "/gaming/consoles" },
        { label: "Gaming Accessories", href: "/gaming/accessories" },
        { label: "Gaming Headphones", href: "/gaming/headphones" },
        { label: "Gaming Mouse", href: "/gaming/mouse" },
      ],
    },
    {
      title: "Fashion",
      links: [
        { label: "Men's Clothing", href: "/fashion/mens-clothing" },
        { label: "Women's Clothing", href: "/fashion/womens-clothing" },
        { label: "Women's Handbags", href: "/fashion/womens-handbags" },
        { label: "Men's Jackets & Coats", href: "/fashion/mens-jackets" },
        { label: "Peshawari Chappal", href: "/fashion/peshawari-chappal" },
      ],
    },
    {
      title: "Beauty",
      links: [
        { label: "Brush sets", href: "/beauty/brush-sets" },
        { label: "Lip Makeup", href: "/beauty/lip-makeup" },
        { label: "Nail Cosmetics", href: "/beauty/nail-cosmetics" },
        { label: "Eye Makeup", href: "/beauty/eye-makeup" },
        { label: "Accessories", href: "/beauty/accessories" },
      ],
    },
    {
      title: "Kids",
      links: [
        { label: "Toys", href: "/kids/toys" },
        { label: "Baby Monitors", href: "/kids/baby-monitors" },
        { label: "Diapers & Wipes", href: "/kids/diapers-wipes" },
        { label: "Boys Clothing", href: "/kids/boys-clothing" },
        { label: "Girls Clothing", href: "/kids/girls-clothing" },
      ],
    },
  ],
  paymentMethods: ["visa", "mastercard", "jazzcash", "easypaisa"],
  socials: [
    { platform: "facebook", href: "https://facebook.com" },
    { platform: "x", href: "https://x.com" },
    { platform: "instagram", href: "https://instagram.com" },
    { platform: "pinterest", href: "https://pinterest.com" },
    { platform: "youtube", href: "https://youtube.com" },
  ],
  copyrightText: `© ${new Date().getFullYear()} iShopping.pk. All rights reserved.`,
  poweredByText: "Powered by JW & FA Companies (Pvt.) Limited",
};
