import { Meilisearch, Index } from "meilisearch";

// ============================================================
// CLIENT
// ============================================================

const host =
    process.env.MEILISEARCH_HOST ?? "http://localhost:7700";
const apiKey =
    process.env.MEILISEARCH_API_KEY ?? "";

let _client: Meilisearch | null = null;

export function getSearchClient(): Meilisearch {
    if (!_client) {
        _client = new Meilisearch({ host, apiKey });
    }
    return _client;
}

// ============================================================
// INDEXES
// ============================================================

export const PRODUCTS_INDEX = "products";

export function getProductsIndex(): Index {
    return getSearchClient().index(PRODUCTS_INDEX);
}

// ============================================================
// DOCUMENT TYPES
// ============================================================

/**
 * Represents a product document indexed in Meilisearch.
 * Indexed at the SellerListing level so each listing is its
 * own document (supports per-seller price/condition facets).
 */
export interface ProductSearchDocument {
    /** Listing ID — the primary document key */
    id: string;
    productId: string;
    sellerId: string;
    shopName: string;
    shopSlug: string;

    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;

    price: number;
    compareAtPrice: number | null;

    condition: string;
    status: string;

    brandId: string | null;
    brandName: string | null;

    categoryIds: string[];
    categoryNames: string[];

    imageUrl: string | null;

    /** Numeric rating for range filters (0–5) */
    averageRating: number;
    reviewCount: number;

    productType: string;

    createdAt: number; // Unix timestamp (ms) for sorting
    updatedAt: number;
}

// ============================================================
// INDEX OPERATIONS
// ============================================================

/**
 * Add or replace one or more listing documents in the products index.
 */
export async function indexProducts(
    docs: ProductSearchDocument[]
): Promise<void> {
    if (docs.length === 0) return;
    await getProductsIndex().addDocuments(docs, {
        primaryKey: "id",
    });
}

/**
 * Update specific fields of existing documents.
 */
export async function updateProducts(
    docs: Partial<ProductSearchDocument> & { id: string }[]
): Promise<void> {
    if (docs.length === 0) return;
    await getProductsIndex().updateDocuments(docs, {
        primaryKey: "id",
    });
}

/**
 * Remove listing documents by their IDs.
 */
export async function deleteProducts(
    ids: string[]
): Promise<void> {
    if (ids.length === 0) return;
    await getProductsIndex().deleteDocuments(ids);
}

// ============================================================
// SEARCH
// ============================================================

export interface SearchParams {
    query: string;
    /** Filter expression (Meilisearch filter syntax) */
    filter?: string | string[];
    /** Comma-separated list of attributes to sort by */
    sort?: string[];
    offset?: number;
    limit?: number;
    facets?: string[];
}

export async function searchProducts(params: SearchParams) {
    const {
        query,
        filter,
        sort,
        offset = 0,
        limit = 20,
        facets,
    } = params;

    return getProductsIndex().search<ProductSearchDocument>(
        query,
        {
            filter,
            sort,
            offset,
            limit,
            facets,
            attributesToHighlight: ["name", "description"],
            highlightPreTag: "<mark>",
            highlightPostTag: "</mark>",
        }
    );
}

// ============================================================
// SETUP — run once (e.g. from a seed or admin script)
// ============================================================

/**
 * Configure the products index settings (filterable & sortable attributes).
 * Call this once during initial setup or after index creation.
 */
export async function setupProductsIndex(): Promise<void> {
    const index = getProductsIndex();

    await index.updateFilterableAttributes([
        "categoryIds",
        "brandId",
        "sellerId",
        "condition",
        "status",
        "productType",
        "price",
        "averageRating",
    ]);

    await index.updateSortableAttributes([
        "price",
        "averageRating",
        "reviewCount",
        "createdAt",
        "updatedAt",
    ]);

    await index.updateSearchableAttributes([
        "name",
        "description",
        "shortDescription",
        "brandName",
        "shopName",
        "categoryNames",
    ]);

    await index.updateRankingRules([
        "words",
        "typo",
        "proximity",
        "attribute",
        "sort",
        "exactness",
    ]);
}
