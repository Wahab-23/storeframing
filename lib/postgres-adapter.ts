import { PrismaPg } from "@prisma/adapter-pg";

export function createPostgresAdapter(databaseUrl = process.env.DATABASE_URL) {
    // Pass configuration, not a Pool instance: the application and adapter can
    // resolve different pg versions, whose Pool constructors are incompatible.
    return new PrismaPg({
        connectionString: databaseUrl,
        ssl: databaseUrl?.includes("localhost")
            ? false
            : { rejectUnauthorized: false },
    });
}
