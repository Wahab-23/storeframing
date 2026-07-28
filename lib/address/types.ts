import { Address, User } from "@/generated/prisma/client";

export interface AddressSession {
    user: User;
}

export interface AddressServiceResponse<T = unknown> {
    status: number;
    message: string;
    data: T;
}

export type AddressRecord = Address;
