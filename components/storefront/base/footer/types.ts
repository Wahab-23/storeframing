export interface FooterLogoConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface FooterContactCard {
  icon: "phone" | "whatsapp" | "mail";
  label: string;
  value: string;
  href: string;
}

export interface FooterValueProp {
  icon: "truck" | "banknote" | "headphones" | "thumbsup";
  title: string;
  description: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterCategory {
  title: string;
  links: FooterLink[];
}

export interface FooterSocialLink {
  platform: "facebook" | "x" | "instagram" | "pinterest" | "youtube";
  href: string;
}

export interface FooterData {
  logo: FooterLogoConfig;
  contacts: FooterContactCard[];
  valueProps: FooterValueProp[];
  categories: FooterCategory[];
  paymentMethods: ("visa" | "mastercard" | "jazzcash" | "easypaisa")[];
  socials: FooterSocialLink[];
  copyrightText: string;
  poweredByText: string;
}
