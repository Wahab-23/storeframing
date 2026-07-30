import { NextRequest, NextResponse } from "next/server";

import { AppError } from "@/lib/errors";
import { error, success } from "@/lib/api-response";

type Handler<T, TArgs extends unknown[] = []> = (
    request: NextRequest,
    ...args: TArgs
) => Promise<{
    data?: T;
    message?: string;
    status?: number;
} | NextResponse>;

export function withApiHandler<T, TArgs extends unknown[] = []>(
    handler: Handler<T, TArgs>
) {
    return async (request: NextRequest, ...args: TArgs) => {
        try {
            const result = await handler(request, ...args);

            if (result instanceof NextResponse) {
                return result;
            }

            return success(result.data, result.message, result.status);
        } catch (err) {
            if (err instanceof AppError) {
                return error(err.message, err.status);
            }

            console.error(err);
            return error("Internal Server Error", 500);
        }
    };
}
