import assert from "node:assert/strict";
import test from "node:test";

import { PRODUCTS_INDEX, ensureProductsIndex, getSearchClient } from "../lib/search";

test("ensureProductsIndex creates and configures the products index", async () => {
    const client = getSearchClient();
    await client.deleteIndexIfExists(PRODUCTS_INDEX);

    await assert.doesNotReject(async () => {
        await ensureProductsIndex();
    });

    const index = client.index(PRODUCTS_INDEX);
    const rawIndex = await client.getRawIndex(PRODUCTS_INDEX);
    assert.equal(rawIndex.uid, PRODUCTS_INDEX);

    const settings = await index.getSettings();
    assert.ok(settings.filterableAttributes?.includes("categoryIds"));
    assert.ok(settings.sortableAttributes?.includes("price"));
});
