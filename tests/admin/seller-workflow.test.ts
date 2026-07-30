import test from "node:test";
import assert from "node:assert/strict";

import { resolveAdminPermissionContext } from "@/lib/admin/permission-utils";

test("seller moderation requires seller write permission", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "staff" } }],
            permissions: ["admin:sellers:read"],
        },
        "admin:sellers:write"
    );

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "Permission denied.");
});

test("seller moderation allows admins with seller write permission", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "admin" } }],
            permissions: ["admin:sellers:write"],
        },
        "admin:sellers:write"
    );

    assert.equal(result.allowed, true);
});
