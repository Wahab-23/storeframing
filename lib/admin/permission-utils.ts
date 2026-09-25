type PermissionContextInput = {
    roleAssignments: Array<{ role: { slug: string } }>;
    permissions: string[];
};

type PermissionContextResult = {
    allowed: boolean;
    reason?: string;
    roleSlugs: string[];
};

function hasPermissionMatch(permissions: string[], permissionSlug: string) {
    return permissions.some(
        (permission) =>
            permission === "*" ||
            permission === permissionSlug ||
            (permission.endsWith(":*") && permissionSlug.startsWith(permission.slice(0, -1)))
    );
}

export function resolveAdminPermissionContext(
    input: PermissionContextInput,
    permissionSlug: string | string[] = "admin:access"
): PermissionContextResult {
    const roleSlugs = input.roleAssignments.map((assignment) => assignment.role.slug);
    const hasAdminRole = roleSlugs.some((slug) =>
        ["admin", "staff", "super-admin"].includes(slug)
    );

    if (!hasAdminRole) {
        return { allowed: false, reason: "Admin access required.", roleSlugs };
    }

    // Super Admin has unrestricted access to all features
    if (roleSlugs.includes("super-admin")) {
        return { allowed: true, roleSlugs };
    }

    const requiredSlugs = Array.isArray(permissionSlug) ? permissionSlug : [permissionSlug];

    if (
        requiredSlugs.includes("admin:access") ||
        requiredSlugs.some((slug) => hasPermissionMatch(input.permissions, slug))
    ) {
        return { allowed: true, roleSlugs };
    }

    return { allowed: false, reason: "Permission denied.", roleSlugs };
}
