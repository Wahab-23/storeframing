import { PrismaClient } from "../generated/prisma/client";
import { createPostgresAdapter } from "./postgres-adapter";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    const adapter = createPostgresAdapter();

    return new PrismaClient({
        adapter,
        log: ["error", "warn"],
    });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
