import { NextRequest } from "next/server";

import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";

import { getAdminPermissions } from "./get-admin-permissions";
import { resolveAdminPermissionContext } from "./permission-utils";

export type AdminContext = {
    user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
    roleSlugs: string[];
    permissions: string[];
};

export async function getAdminContext(
    request: NextRequest,
    permissionSlug?: string
): Promise<AdminContext> {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const roleAssignments = user.roleAssignments ?? [];
    const permissions = await getAdminPermissions(user.id);
    const context = resolveAdminPermissionContext(
        {
            roleAssignments,
            permissions,
        },
        permissionSlug ?? "admin:access"
    );

    if (!context.allowed) {
        throw new ForbiddenError(context.reason ?? "Admin access required.");
    }

    return {
        user,
        roleSlugs: context.roleSlugs,
        permissions,
    };
}
