import { cookies } from "next/headers";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";

const GUEST_COOKIE_NAME = "guest_cart";

export async function getOrCreateCart(userId?: string) {
    if (userId) {
        return prisma.cart.upsert({
            where: {
                userId_status: {
                    userId,
                    status: "ACTIVE",
                },
            },
            update: {},
            create: {
                userId,
                status: "ACTIVE",
            },
        });
    }

    const cookieStore = await cookies();

    let guestToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    if (!guestToken) {
        guestToken = randomUUID();

        cookieStore.set(GUEST_COOKIE_NAME, guestToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });
    }

    const existing = await prisma.cart.findUnique({
        where: {
            guestToken,
        },
    });

    if (existing) {
        return existing;
    }

    return prisma.cart.create({
        data: {
            guestToken,
            status: "ACTIVE",
        },
    });
}