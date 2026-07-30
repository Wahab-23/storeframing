import test from "node:test";
import assert from "node:assert/strict";

import { resolveAdminPermissionContext } from "@/lib/admin/permission-utils";

test("allows access when the user has an admin role and the required permission", () => {
    const result = resolveAdminPermissionContext({
        roleAssignments: [
            {
                role: {
                    slug: "admin",
                },
            },
        ],
        permissions: ["products:read"],
    }, "products:read");

    assert.equal(result.allowed, true);
    assert.deepEqual(result.roleSlugs, ["admin"]);
});

test("rejects access when the user lacks the required permission", () => {
    const result = resolveAdminPermissionContext({
        roleAssignments: [
            {
                role: {
                    slug: "staff",
                },
            },
        ],
        permissions: ["orders:read"],
    }, "products:read");

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "Permission denied.");
});

test("allows access when the user has a wildcard admin permission", () => {
    const result = resolveAdminPermissionContext({
        roleAssignments: [
            {
                role: {
                    slug: "admin",
                },
            },
        ],
        permissions: ["admin:*"],
    }, "admin:categories:write");

    assert.equal(result.allowed, true);
    assert.deepEqual(result.roleSlugs, ["admin"]);
});

test("allows access when the user has a namespace wildcard permission", () => {
    const result = resolveAdminPermissionContext({
        roleAssignments: [
            {
                role: {
                    slug: "admin",
                },
            },
        ],
        permissions: ["admin:categories:*"],
    }, "admin:categories:write");

    assert.equal(result.allowed, true);
    assert.deepEqual(result.roleSlugs, ["admin"]);
});

test("rejects access when the user has no admin-type role", () => {
    const result = resolveAdminPermissionContext({
        roleAssignments: [
            {
                role: {
                    slug: "customer",
                },
            },
        ],
        permissions: ["products:read"],
    }, "products:read");

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "Admin access required.");
});
