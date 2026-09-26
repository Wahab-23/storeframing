import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";

const handleLogout = async () => {
    const response = NextResponse.json({
        success: true,
        message: "Logged out successfully",
    });

    response.cookies.set({
        name: "access_token",
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
    });

    return response;
};

export const POST = withApiHandler(handleLogout);
export const GET = withApiHandler(handleLogout);

