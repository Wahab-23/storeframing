import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const DEMO_PASSWORD = "Password123!";

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
        {
            name: "Super Admin",
            slug: "super-admin",
            description: "Protected marketplace super administrator",
        },
    ];

    const permissions = [
        { name: "Dashboard overview", slug: "admin:overview:read", description: "View admin dashboard overview" },
        { name: "Analytics", slug: "admin:analytics:read", description: "View admin analytics" },
        { name: "Audit logs", slug: "admin:audit-logs:read", description: "View audit logs" },
        { name: "Orders read", slug: "admin:orders:read", description: "View orders" },
        { name: "Products read", slug: "admin:products:read", description: "View products" },
        { name: "Products write", slug: "admin:products:write", description: "Create or update products" },
        { name: "Sellers read", slug: "admin:sellers:read", description: "View sellers" },
        { name: "Sellers write", slug: "admin:sellers:write", description: "Approve or update sellers" },
        { name: "Users write", slug: "admin:users:write", description: "Manage admin users" },
        { name: "Reports read", slug: "admin:reports:read", description: "View reports" },
        { name: "Refunds write", slug: "admin:refunds:write", description: "Process refunds" },
        { name: "Inventory write", slug: "inventory:write", description: "Adjust inventory" },
        { name: "Settings update", slug: "settings:update", description: "Update marketplace settings" },
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

    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { slug: permission.slug },
            update: {
                name: permission.name,
                description: permission.description,
            },
            create: {
                name: permission.name,
                slug: permission.slug,
                description: permission.description,
            },
        });
    }

    const adminRole = await prisma.role.findFirst({
        where: {
            slug: "admin",
            sellerId: null,
        },
    });

    const staffRole = await prisma.role.findFirst({
        where: {
            slug: "staff",
            sellerId: null,
        },
    });

    const superAdminRole = await prisma.role.findFirst({
        where: {
            slug: "super-admin",
            sellerId: null,
        },
    });

    const allPermissionSlugs = permissions.map((permission) => permission.slug);
    const staffPermissionSlugs = [
        "admin:overview:read",
        "admin:analytics:read",
        "admin:orders:read",
        "admin:products:read",
        "admin:sellers:read",
        "admin:reports:read",
    ];

    for (const role of [adminRole, staffRole, superAdminRole]) {
        if (!role) {
            continue;
        }

        const rolePermissions = await prisma.rolePermission.findMany({
            where: { roleId: role.id },
            select: { permission: { select: { slug: true } } },
        });

        const existingSlugs = rolePermissions.map((entry) => entry.permission.slug);
        const desiredSlugs = role.slug === "staff"
            ? staffPermissionSlugs
            : role.slug === "super-admin"
                ? allPermissionSlugs
                : allPermissionSlugs;

        for (const slug of desiredSlugs) {
            if (existingSlugs.includes(slug)) {
                continue;
            }

            const permission = await prisma.permission.findUnique({
                where: { slug },
                select: { id: true },
            });

            if (permission) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: role.id,
                        permissionId: permission.id,
                    },
                });
            }
        }
    }

    console.log("Roles and permissions seeded successfully");

    const customerRole = await prisma.role.findFirst({
        where: { slug: "customer", sellerId: null },
    });
    const sellerRole = await prisma.role.findFirst({
        where: { slug: "seller", sellerId: null },
    });

    if (!customerRole || !sellerRole || !adminRole || !staffRole || !superAdminRole) {
        throw new Error("Required roles were not found after seeding.");
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    async function upsertDemoUser(input: {
        email: string;
        firstName: string;
        lastName: string;
        roleIds: string[];
        phone?: string;
    }) {
        const existing = await prisma.user.findUnique({
            where: { email: input.email },
            select: { id: true },
        });

        if (existing) {
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    passwordHash,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    phone: input.phone,
                    status: "ACTIVE",
                },
            });

            for (const roleId of input.roleIds) {
                await prisma.userRoleAssignment.upsert({
                    where: {
                        userId_roleId: {
                            userId: existing.id,
                            roleId,
                        },
                    },
                    update: {},
                    create: {
                        userId: existing.id,
                        roleId,
                    },
                });
            }

            return existing.id;
        }

        const user = await prisma.user.create({
            data: {
                email: input.email,
                passwordHash,
                firstName: input.firstName,
                lastName: input.lastName,
                phone: input.phone,
                status: "ACTIVE",
                roleAssignments: {
                    create: input.roleIds.map((roleId) => ({ roleId })),
                },
                cart: { create: {} },
                wishlist: { create: {} },
            },
            select: { id: true },
        });

        return user.id;
    }

    const customerUserId = await upsertDemoUser({
        email: "customer@test.com",
        firstName: "Demo",
        lastName: "Customer",
        roleIds: [customerRole.id],
        phone: "+15550000001",
    });

    const sellerUserId = await upsertDemoUser({
        email: "seller@test.com",
        firstName: "Demo",
        lastName: "Seller",
        roleIds: [customerRole.id, sellerRole.id],
        phone: "+15550000002",
    });

    const adminUserId = await upsertDemoUser({
        email: "admin@test.com",
        firstName: "Demo",
        lastName: "Admin",
        roleIds: [customerRole.id, adminRole.id],
        phone: "+15550000003",
    });

    await upsertDemoUser({
        email: "staff@test.com",
        firstName: "Demo",
        lastName: "Staff",
        roleIds: [customerRole.id, staffRole.id],
        phone: "+15550000004",
    });

    await upsertDemoUser({
        email: "superadmin@test.com",
        firstName: "Demo",
        lastName: "SuperAdmin",
        roleIds: [customerRole.id, superAdminRole.id],
        phone: "+15550000005",
    });

    const seller = await prisma.seller.upsert({
        where: { userId: sellerUserId },
        update: {
            shopName: "Demo Electronics Shop",
            slug: "demo-electronics-shop",
            description: "Seeded seller for API testing",
            businessEmail: "seller@test.com",
            businessPhone: "+15550000002",
            status: "ACTIVE",
            verificationStatus: "VERIFIED",
        },
        create: {
            userId: sellerUserId,
            shopName: "Demo Electronics Shop",
            slug: "demo-electronics-shop",
            description: "Seeded seller for API testing",
            businessEmail: "seller@test.com",
            businessPhone: "+15550000002",
            status: "ACTIVE",
            verificationStatus: "VERIFIED",
        },
    });

    await prisma.sellerWallet.upsert({
        where: { sellerId: seller.id },
        update: {},
        create: {
            sellerId: seller.id,
        },
    });

    await prisma.siteSetting.upsert({
        where: { id: "seed-site-settings" },
        update: {
            siteName: "Storeframing Demo",
            siteUrl: "http://localhost:3000",
            defaultTitle: "Storeframing Demo Marketplace",
            defaultMetaDescription: "Demo marketplace for local API testing.",
            updatedByUserId: adminUserId,
        },
        create: {
            id: "seed-site-settings",
            siteName: "Storeframing Demo",
            siteUrl: "http://localhost:3000",
            defaultTitle: "Storeframing Demo Marketplace",
            defaultMetaDescription: "Demo marketplace for local API testing.",
            updatedByUserId: adminUserId,
        },
    });

    const electronicsCategory = await prisma.category.upsert({
        where: { slug: "electronics" },
        update: {
            name: "Electronics",
            description: "Electronic devices and accessories",
            isActive: true,
            sortOrder: 1,
        },
        create: {
            name: "Electronics",
            slug: "electronics",
            description: "Electronic devices and accessories",
            isActive: true,
            sortOrder: 1,
        },
    });

    await prisma.category.upsert({
        where: { slug: "fashion" },
        update: {
            name: "Fashion",
            description: "Clothing and accessories",
            isActive: true,
            sortOrder: 2,
        },
        create: {
            name: "Fashion",
            slug: "fashion",
            description: "Clothing and accessories",
            isActive: true,
            sortOrder: 2,
        },
    });

    const brand = await prisma.brand.upsert({
        where: { slug: "demo-brand" },
        update: {
            name: "Demo Brand",
            isActive: true,
        },
        create: {
            name: "Demo Brand",
            slug: "demo-brand",
            isActive: true,
        },
    });

    const product = await prisma.product.upsert({
        where: { slug: "wireless-headphones" },
        update: {
            name: "Wireless Headphones",
            shortDescription: "Noise-cancelling over-ear headphones",
            description: "Seeded platform product for cart, checkout, and search testing.",
            ownershipType: "PLATFORM",
            productType: "SIMPLE",
            status: "ACTIVE",
            visibility: "VISIBLE",
            brandId: brand.id,
            createdById: adminUserId,
        },
        create: {
            name: "Wireless Headphones",
            slug: "wireless-headphones",
            shortDescription: "Noise-cancelling over-ear headphones",
            description: "Seeded platform product for cart, checkout, and search testing.",
            ownershipType: "PLATFORM",
            productType: "SIMPLE",
            status: "ACTIVE",
            visibility: "VISIBLE",
            brandId: brand.id,
            createdById: adminUserId,
        },
    });

    await prisma.productCategory.upsert({
        where: {
            productId_categoryId: {
                productId: product.id,
                categoryId: electronicsCategory.id,
            },
        },
        update: {},
        create: {
            productId: product.id,
            categoryId: electronicsCategory.id,
        },
    });

    await prisma.productImage.upsert({
        where: { id: "seed-product-image-headphones" },
        update: {
            url: "https://placehold.co/600x600?text=Headphones",
            altText: "Wireless Headphones",
            sortOrder: 0,
            isPrimary: true,
        },
        create: {
            id: "seed-product-image-headphones",
            productId: product.id,
            url: "https://placehold.co/600x600?text=Headphones",
            altText: "Wireless Headphones",
            sortOrder: 0,
            isPrimary: true,
        },
    });

    const listing = await prisma.sellerListing.upsert({
        where: {
            sellerId_productId: {
                sellerId: seller.id,
                productId: product.id,
            },
        },
        update: {
            price: 129.99,
            compareAtPrice: 159.99,
            condition: "NEW",
            status: "ACTIVE",
            description: "In-stock demo listing from seeded seller.",
        },
        create: {
            sellerId: seller.id,
            productId: product.id,
            sellerSku: "DEMO-HEADPHONES-001",
            price: 129.99,
            compareAtPrice: 159.99,
            condition: "NEW",
            status: "ACTIVE",
            description: "In-stock demo listing from seeded seller.",
        },
    });

    await prisma.inventory.upsert({
        where: { listingId: listing.id },
        update: {
            quantity: 50,
            reservedQuantity: 0,
            lowStockThreshold: 5,
        },
        create: {
            listingId: listing.id,
            quantity: 50,
            reservedQuantity: 0,
            lowStockThreshold: 5,
        },
    });

    await prisma.address.upsert({
        where: { id: "seed-customer-address" },
        update: {
            userId: customerUserId,
            type: "SHIPPING",
            firstName: "Demo",
            lastName: "Customer",
            addressLine1: "123 Market Street",
            city: "San Francisco",
            state: "CA",
            postalCode: "94105",
            countryCode: "US",
            phone: "+15550000001",
            isDefault: true,
        },
        create: {
            id: "seed-customer-address",
            userId: customerUserId,
            type: "SHIPPING",
            firstName: "Demo",
            lastName: "Customer",
            addressLine1: "123 Market Street",
            city: "San Francisco",
            state: "CA",
            postalCode: "94105",
            countryCode: "US",
            phone: "+15550000001",
            isDefault: true,
        },
    });

    // Seeding Pending Sellers
    const pendingSellersData = [
        { id: "pending-seller-1", shopName: "TechGadgets Inc.", slug: "techgadgets-inc", email: "techgadgets@test.com" },
        { id: "pending-seller-2", shopName: "Fashion Nova PK", slug: "fashion-nova-pk", email: "fashionnova@test.com" },
        { id: "pending-seller-3", shopName: "HomeDecor Studio", slug: "homedecor-studio", email: "homedecor@test.com" },
    ];
    for (const ps of pendingSellersData) {
        const userEmail = ps.email;
        let uId = "";
        const userExist = await prisma.user.findUnique({ where: { email: userEmail } });
        if (userExist) {
            uId = userExist.id;
        } else {
            uId = (await prisma.user.create({
                data: {
                    email: userEmail,
                    passwordHash,
                    firstName: ps.shopName.split(" ")[0],
                    lastName: "Seller",
                    status: "ACTIVE",
                    roleAssignments: {
                        create: { roleId: sellerRole.id }
                    }
                }
            })).id;
        }

        await prisma.seller.upsert({
            where: { id: ps.id },
            update: { status: "PENDING" },
            create: {
                id: ps.id,
                userId: uId,
                shopName: ps.shopName,
                slug: ps.slug,
                status: "PENDING",
            }
        });
    }

    // Seeding Pending Product Submissions
    const pendingProductsData = [
        { id: "pending-prod-1", title: "Wireless Earbuds Pro", sellerId: seller.id },
        { id: "pending-prod-2", title: "Organic Cotton Tee", sellerId: seller.id },
    ];
    for (const pp of pendingProductsData) {
        await prisma.productSubmission.upsert({
            where: { id: pp.id },
            update: { status: "PENDING_REVIEW" },
            create: {
                id: pp.id,
                sellerId: pp.sellerId,
                title: pp.title,
                payload: {},
                status: "PENDING_REVIEW",
            }
        });
    }

    // Seeding Orders
    const addressJson = {
        firstName: "Demo",
        lastName: "Customer",
        addressLine1: "123 Market Street",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        countryCode: "US",
        phone: "+15550000001",
    };

    console.log("Seeding orders and analytics data...");
    const now = new Date();
    // Delete existing seed orders / returns to avoid database unique constraint violations
    await prisma.returnRequest.deleteMany({ where: { orderId: { startsWith: "seed-order-" } } });
    await prisma.order.deleteMany({ where: { id: { startsWith: "seed-order-" } } });

    for (let i = 0; i < 40; i++) {
        const orderDate = new Date();
        orderDate.setDate(now.getDate() - (i % 30));
        orderDate.setHours(10 + (i % 12), (i * 13) % 60, 0, 0);

        const amount = 50 + (i * 27) % 300;
        const orderId = `seed-order-${i}`;
        const orderNumber = `ORD-${10000 + i}`;

        await prisma.order.create({
            data: {
                id: orderId,
                userId: customerUserId,
                orderNumber,
                status: "DELIVERED",
                subtotal: amount,
                shippingAmount: 10,
                discountAmount: 0,
                taxAmount: amount * 0.05,
                totalAmount: amount + 10 + amount * 0.05,
                currency: "PKR",
                billingAddress: addressJson,
                shippingAddress: addressJson,
                createdAt: orderDate,
                updatedAt: orderDate,
            }
        });
    }

    // Seeding Return Requests
    const returnRequestsData = [
        { id: "seed-return-1", orderId: "seed-order-5", status: "REQUESTED" as const, reason: "DAMAGED" as const },
        { id: "seed-return-2", orderId: "seed-order-15", status: "RECEIVED" as const, reason: "DEFECTIVE" as const },
        { id: "seed-return-3", orderId: "seed-order-25", status: "INSPECTING" as const, reason: "WRONG_ITEM" as const },
    ];
    for (const rr of returnRequestsData) {
        await prisma.returnRequest.upsert({
            where: { id: rr.id },
            update: {
                status: rr.status,
                reason: rr.reason,
            },
            create: {
                id: rr.id,
                orderId: rr.orderId,
                userId: customerUserId,
                status: rr.status,
                reason: rr.reason,
                description: "Seeded test dispute request.",
            }
        });
    }

    // Seeding Audit Logs
    await prisma.auditLog.deleteMany({ where: { id: { startsWith: "seed-audit-" } } });

    const auditLogsData = [
        { id: "seed-audit-1", action: "APPROVE" as const, entityType: "Seller", entityId: seller.id, timeMinsAgo: 5 },
        { id: "seed-audit-2", action: "CREATE" as const, entityType: "ProductSubmission", entityId: "pending-prod-1", timeMinsAgo: 45 },
        { id: "seed-audit-3", action: "CREATE" as const, entityType: "Order", entityId: "seed-order-0", timeMinsAgo: 120 },
        { id: "seed-audit-4", action: "REJECT" as const, entityType: "ProductSubmission", entityId: "pending-prod-2", timeMinsAgo: 180 },
        { id: "seed-audit-5", action: "UPDATE" as const, entityType: "SiteSetting", entityId: "seed-setting", timeMinsAgo: 360 },
    ];

    for (const al of auditLogsData) {
        const logDate = new Date();
        logDate.setMinutes(logDate.getMinutes() - al.timeMinsAgo);

        await prisma.auditLog.create({
            data: {
                id: al.id,
                userId: customerUserId,
                action: al.action,
                entityType: al.entityType,
                entityId: al.entityId,
                createdAt: logDate,
            }
        });
    }

    console.log("Demo users, catalog, orders, audit logs, and sample listings seeded successfully");
    console.log("");
    console.log("Demo accounts (password for all: Password123!)");
    console.log("  customer@test.com   — customer");
    console.log("  seller@test.com     — seller (approved shop)");
    console.log("  admin@test.com      — admin");
    console.log("  staff@test.com      — staff (limited permissions)");
    console.log("  superadmin@test.com — super admin");
    console.log("");
    console.log(`Sample product ID: ${product.id}`);
    console.log(`Sample listing ID: ${listing.id}`);
    console.log(`Sample seller ID:  ${seller.id}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });