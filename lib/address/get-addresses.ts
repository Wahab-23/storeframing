import { prisma } from "@/lib/prisma";

type GetAddressesInput = {
    userId: string;
};

export async function getAddresses({ userId }: GetAddressesInput) {
    const addresses = await prisma.address.findMany({
        where: {
            userId,
        },
        orderBy: [
            {
                isDefault: "desc",
            },
            {
                createdAt: "desc",
            },
        ],
    });

    return {
        status: 200,
        message: "Addresses fetched successfully.",
        data: {
            addresses,
        },
    };
}
