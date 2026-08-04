"use me";
"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
    Menu,
    Search,
    Bell,
    Coffee,
    ChevronDown,
    User,
    Settings,
    LogOut,
    Sparkles,
    CheckCircle2
} from "lucide-react";

export function AdminHeader({
    onMenuClick,
}: {
    onMenuClick: () => void;
}) {
    const pathname = usePathname();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Compute title from route
    const pathParts = pathname.split("/").filter(Boolean);
    const currentTitle =
        pathParts.length > 1
            ? pathParts[pathParts.length - 1]
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : "Hiring Statistics";

    const notifications = [
        { id: 1, title: "New seller application", time: "5m ago", type: "seller" },
        { id: 2, title: "Product revision submitted", time: "20m ago", type: "product" },
        { id: 3, title: "High volume order alert", time: "1h ago", type: "order" },
    ];

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all">
            {/* Left: Mobile Menu & Page Title / Breadcrumb */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 text-slate-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                        {currentTitle === "Dashboard" ? "Hiring Statistics" : currentTitle}
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                        <span>Admin</span>
                        <span>/</span>
                        <span className="capitalize text-slate-600 dark:text-slate-300 font-semibold">
                            {pathParts.slice(1).join(" / ") || "Dashboard"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search anything... (Ctrl + K)"
                        className="w-64 pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all"
                    />
                </div>

                {/* Free Plan / Status Badge matching image */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-100 dark:border-indigo-900/50">
                    <Coffee className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Free Plan</span>
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setNotificationsOpen(!notificationsOpen);
                            setProfileOpen(false);
                        }}
                        className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                    </button>

                    {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    Notifications
                                </h3>
                                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                                    3 New
                                </span>
                            </div>
                            <div className="space-y-2">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                                    >
                                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                            {n.title}
                                        </p>
                                        <span className="text-[10px] text-slate-400">{n.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Avatar Menu */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setProfileOpen(!profileOpen);
                            setNotificationsOpen(false);
                        }}
                        className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/20 transition-all"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                            alt="Admin User"
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                    </button>

                    {profileOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    Abdul Wahab
                                </p>
                                <p className="text-[11px] text-slate-400">admin@storeframing.com</p>
                            </div>
                            <div className="py-1">
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                                    <User className="w-4 h-4 text-slate-400" />
                                    Profile Settings
                                </button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    System Controls
                                </button>
                            </div>
                            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => {
                                        document.cookie =
                                            "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                                        window.location.href = "/admin/login";
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
