import { NextRequest } from "next/server";

import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function getAdminUser(request: NextRequest) {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const isAdmin = user.roleAssignments.some(
        (assignment) => assignment.role.slug === "admin"
    );

    const isStaff = user.roleAssignments.some(
        (assignment) => assignment.role.slug === "staff"
    );

    if (!isAdmin && !isStaff) {
        throw new ForbiddenError("Admin access required.");
    }

    return user;
}
