"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, Command, LogOut, Settings, Users, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/admin/login";
    }
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b shrink-0 relative z-30"
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
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border"
            style={{ background: "#FCC014", borderColor: "#0d1117" }}
          />
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95 border"
            style={{
              background: "#FCC014",
              color: "#0d1117",
              borderColor: menuOpen ? "#fff" : "transparent",
            }}
            title="User Profile & Settings"
          >
            AD
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl py-2 border backdrop-blur-md"
              style={{
                background: "rgba(17, 24, 39, 0.95)",
                borderColor: "rgba(252, 192, 20, 0.2)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
              }}
            >
              {/* User details */}
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                <p className="text-white text-xs font-semibold">Admin User</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield className="w-3 h-3 text-[#FCC014]" />
                  <span className="text-[11px] font-medium text-[#FCC014]">Super Admin</span>
                </div>
              </div>

              {/* Navigation links */}
              <div className="py-1">
                <Link
                  href="/admin/administration/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-white/40" />
                  System Settings
                </Link>
                <Link
                  href="/admin/administration/users"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-white/40" />
                  Admin Users
                </Link>
              </div>

              {/* Sign out */}
              <div className="pt-1 border-t" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogOut className={`w-3.5 h-3.5 ${isLoggingOut ? "animate-pulse" : ""}`} />
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

