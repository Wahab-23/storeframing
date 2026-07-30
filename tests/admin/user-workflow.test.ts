import test from "node:test";
import assert from "node:assert/strict";

import { resolveAdminPermissionContext } from "@/lib/admin/permission-utils";

test("user moderation requires user write permission", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "staff" } }],
            permissions: ["admin:users:read"],
        },
        "admin:users:write"
    );

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "Permission denied.");
});

test("user moderation allows admins with user write permission", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "admin" } }],
            permissions: ["admin:users:write"],
        },
        "admin:users:write"
    );

    assert.equal(result.allowed, true);
});
