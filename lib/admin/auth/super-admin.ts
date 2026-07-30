import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/errors";

export const SUPER_ADMIN_ROLE_SLUG = "super-admin";

/**
 * Checks if the target user is the last active super-admin.
 * Throws ForbiddenError if deactivating or removing role would leave 0 active super-admins.
 */
export async function assertNotLastSuperAdmin(targetUserId: string): Promise<void> {
    const superAdminRole = await prisma.role.findFirst({
        where: { slug: SUPER_ADMIN_ROLE_SLUG, sellerId: null },
    });

    if (!superAdminRole) {
        return;
    }

    const activeSuperAdmins = await prisma.userRoleAssignment.count({
        where: {
            roleId: superAdminRole.id,
            user: {
                status: "ACTIVE",
            },
        },
    });

    if (activeSuperAdmins <= 1) {
        const targetIsActiveSuperAdmin = await prisma.userRoleAssignment.findFirst({
            where: {
                userId: targetUserId,
                roleId: superAdminRole.id,
                user: {
                    status: "ACTIVE",
                },
            },
        });

        if (targetIsActiveSuperAdmin) {
            throw new ForbiddenError(
                "Action rejected: Cannot deactivate, remove, or modify the final active super-admin account."
            );
        }
    }
}

/**
 * Validates that an admin performing a modification has permission to modify the target user.
 * Non-super-admins cannot modify super-admin accounts.
 */
export function validateAdminHierarchy(
    actorRoleSlugs: string[],
    targetRoleSlugs: string[]
): void {
    const actorIsSuperAdmin = actorRoleSlugs.includes(SUPER_ADMIN_ROLE_SLUG);
    const targetIsSuperAdmin = targetRoleSlugs.includes(SUPER_ADMIN_ROLE_SLUG);

    if (targetIsSuperAdmin && !actorIsSuperAdmin) {
        throw new ForbiddenError("Only a super-admin can modify a super-admin account.");
    }
}
