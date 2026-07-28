import { NextResponse } from "next/server";

export function success(
    data?: unknown,
    message = "Success",
    status = 200
) {
    return NextResponse.json(
        {
            success: true,
            message,
            data,
        },
        {
            status,
        }
    );
}

export function error(
    message = "Something went wrong",
    status = 500,
    errors?: unknown
) {
    return NextResponse.json(
        {
            success: false,
            message,
            errors,
        },
        {
            status,
        }
    );
}