import test from "node:test";
import assert from "node:assert/strict";

import { resolveAdminPermissionContext } from "@/lib/admin/permission-utils";

test("product workflow decisions require an admin role with write access", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "staff" } }],
            permissions: ["admin:products:read"],
        },
        "admin:products:write"
    );

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "Permission denied.");
});

test("product workflow decisions allow admin users with write access", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "admin" } }],
            permissions: ["admin:products:write"],
        },
        "admin:products:write"
    );

    assert.equal(result.allowed, true);
});
