import test from "node:test";
import assert from "node:assert/strict";

import { resolveAdminPermissionContext } from "@/lib/admin/permission-utils";

test("refund processing requires refund write permission", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "staff" } }],
            permissions: ["admin:refunds:read"],
        },
        "admin:refunds:write"
    );

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "Permission denied.");
});

test("refund processing allows admins with refund write permission", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "admin" } }],
            permissions: ["admin:refunds:write"],
        },
        "admin:refunds:write"
    );

    assert.equal(result.allowed, true);
});
