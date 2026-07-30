import test from "node:test";
import assert from "node:assert/strict";

import { normalizeSiteSettingsInput } from "@/lib/admin/site-settings";

test("normalizes site settings input by removing undefined values", () => {
    const result = normalizeSiteSettingsInput({
        siteName: "Storefront",
        defaultTitle: undefined,
        robots: null,
    });

    assert.deepEqual(result, {
        siteName: "Storefront",
        robots: null,
    });
});

test("preserves explicit false values when normalizing input", () => {
    const result = normalizeSiteSettingsInput({
        siteName: "Storefront",
        defaultTitle: "",
        organizationJson: {
            companyName: "Acme",
            showContact: false,
        },
    });

    assert.equal(result.defaultTitle, "");
    assert.deepEqual(result.organizationJson, {
        companyName: "Acme",
        showContact: false,
    });
});
