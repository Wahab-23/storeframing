import test from "node:test";
import assert from "node:assert/strict";

import { resolveAdminPermissionContext } from "@/lib/admin/permission-utils";

test("finance settlement requires finance write permission", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "staff" } }],
            permissions: ["finance:read"],
        },
        "finance:write"
    );

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "Permission denied.");
});

test("finance settlement allows admins with finance write permission", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "admin" } }],
            permissions: ["finance:write"],
        },
        "finance:write"
    );

    assert.equal(result.allowed, true);
});
