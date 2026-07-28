export function serializeAdminPagination(
    page: number,
    limit: number,
    total: number
) {
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}
