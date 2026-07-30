type CachedPermissions = {
    expiresAt: number;
    permissions: string[];
};

const cache = new Map<string, CachedPermissions>();

const TTL_MS = 60_000;

export function getCachedPermissions(userId: string) {
    const cached = cache.get(userId);

    if (!cached) {
        return null;
    }

    if (cached.expiresAt < Date.now()) {
        cache.delete(userId);
        return null;
    }

    return cached.permissions;
}

export function setCachedPermissions(userId: string, permissions: string[]) {
    cache.set(userId, {
        permissions,
        expiresAt: Date.now() + TTL_MS,
    });
}

