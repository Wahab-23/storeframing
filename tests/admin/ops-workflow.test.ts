import test from "node:test";
import assert from "node:assert/strict";

import { resolveAdminPermissionContext } from "@/lib/admin/permission-utils";

test("audit log access requires audit log read permission", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "staff" } }],
            permissions: ["admin:overview:read"],
        },
        "admin:audit-logs:read"
    );

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "Permission denied.");
});

test("reports access requires reports read permission", () => {
    const result = resolveAdminPermissionContext(
        {
            roleAssignments: [{ role: { slug: "admin" } }],
            permissions: ["admin:reports:read"],
        },
        "admin:reports:read"
    );

    assert.equal(result.allowed, true);
});
