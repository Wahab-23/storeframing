import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const roles = [
        {
            name: "Customer",
            slug: "customer",
            description: "Marketplace customer",
        },
        {
            name: "Seller",
            slug: "seller",
            description: "Marketplace seller",
        },
        {
            name: "Admin",
            slug: "admin",
            description: "Marketplace administrator",
        },
        {
            name: "Staff",
            slug: "staff",
            description: "Marketplace staff member",
        },
    ];

    for (const role of roles) {
        const existing = await prisma.role.findFirst({
            where: {
                slug: role.slug,
                sellerId: null,
            },
        });

        if (existing) {
            await prisma.role.update({
                where: { id: existing.id },
                data: {
                    name: role.name,
                    description: role.description,
                },
            });
        } else {
            await prisma.role.create({
                data: {
                    name: role.name,
                    slug: role.slug,
                    description: role.description,
                    sellerId: null,
                },
            });
        }
    }

    console.log("Roles seeded successfully");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });