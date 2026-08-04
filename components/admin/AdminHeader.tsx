"use client";

import { Bell, Search, Command } from "lucide-react";
import Image from "next/image";

export default function AdminHeader() {
  return (
    <header
      className="h-14 flex items-center justify-between px-6 border-b shrink-0"
      style={{
        background: "#0d1117",
        borderColor: "rgba(252,192,20,0.12)",
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "rgba(255,255,255,0.3)" }}
          />
          <input
            type="text"
            placeholder="Search marketplace..."
            className="w-full pl-9 pr-20 py-2 text-sm rounded-lg focus:outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.7)",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.border =
                "1px solid rgba(252,192,20,0.4)";
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.07)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.border =
                "1px solid rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.05)";
            }}
          />
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-4">
        {/* System status chip */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "#22c55e",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          All Systems Operational
        </div>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-all cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(252,192,20,0.3)";
            (e.currentTarget as HTMLElement).style.color = "#FCC014";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLElement).style.color =
              "rgba(255,255,255,0.5)";
          }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border"
            style={{ background: "#FCC014", borderColor: "#0d1117" }}
          />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
          style={{ background: "#FCC014", color: "#0d1117" }}
        >
          AD
        </div>
      </div>
    </header>
  );
}
