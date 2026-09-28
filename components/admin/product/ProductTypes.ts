export interface BrandOption {
  id: string;
  name: string;
  slug?: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: CategoryOption[];
}

export interface SellerOption {
  id: string;
  shopName: string;
  slug?: string;
}

export type ConfigurableOptionSelectorType =
  | "COLOR_SWATCH"
  | "IMAGE_SWATCH"
  | "BUTTON_TILES"
  | "DROPDOWN"
  | "RADIO_CARDS";

export interface ConfigurableOptionValueState {
  id?: string;
  label: string;
  value: string;
  swatchValue?: string;
  priceDelta?: string | number;
  position?: number;
  isDefault?: boolean;
}

export interface ConfigurableOptionState {
  id?: string;
  name: string;
  code: string;
  type: ConfigurableOptionSelectorType;
  position?: number;
  isRequired?: boolean;
  values: ConfigurableOptionValueState[];
}

export interface VariantItem {
  id?: string;
  name: string;
  sku: string;
  priceDelta?: number | string | null;
}

export interface SellerListingItem {
  id: string;
  sellerId: string;
  seller: {
    id: string;
    shopName: string;
    slug?: string;
  };
  sellerSku?: string | null;
  price: number | string;
  compareAtPrice?: number | string | null;
  costPrice?: number | string | null;
  condition?: string;
  warrantyTitle?: string | null;
  warrantyDescription?: string | null;
  description?: string | null;
  status: string;
  inventory?: {
    quantity: number;
  } | null;
}

import type { RevisionItem } from "@/components/admin/ProductRevisionTimeline";
export type { RevisionItem };
