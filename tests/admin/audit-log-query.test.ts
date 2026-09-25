import test from "node:test";
import assert from "node:assert/strict";

import { auditLogsQuerySchema } from "@/lib/validators/reports";

test("audit log filters accept pagination, actor/entity search, and date range", () => {
    const result = auditLogsQuerySchema.safeParse({
        page: "2",
        limit: "15",
        search: "  wahab@example.com  ",
        action: "UPDATE",
        entityType: "PRODUCT",
        from: "2026-09-01T00:00:00.000Z",
        to: "2026-09-25T23:59:59.999Z",
    });

    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.page, 2);
        assert.equal(result.data.search, "wahab@example.com");
        assert.equal(result.data.action, "UPDATE");
    }
});

test("audit log search rejects overlong terms and invalid dates", () => {
    assert.equal(
        auditLogsQuerySchema.safeParse({ search: "x".repeat(101) }).success,
        false
    );
    assert.equal(
        auditLogsQuerySchema.safeParse({ from: "yesterday" }).success,
        false
    );
});
