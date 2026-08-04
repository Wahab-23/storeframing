"use client";

import { useState } from "react";
import { Store, ArrowRight, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      // The server sets the HttpOnly access_token cookie automatically.
      // Just verify the user has admin access and redirect.
      const roles: string[] = result.data?.user?.roles ?? [];
      const isAdmin = roles.some((r) =>
        ['admin', 'super-admin', 'moderator'].includes(r)
      );

      if (!isAdmin) {
        throw new Error('You do not have admin access.');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      console.error('Admin login error:', message);
      setLoading(false);
      alert(message);
    }
  };

  return (
    <div className="min-h-screen bg-white-chalk-200 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-munsell-blue-500/40 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-sunflower-500/40 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-white-chalk-300 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-munsell-blue-100 text-white mb-6 shadow-md">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-matt-black-100 tracking-tight">
              Marketplace Admin
            </h1>
            <p className="text-matt-black-300 mt-2 text-sm">
              Sign in to access your administration dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-matt-black-200 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-matt-black-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white-chalk-100 border border-matt-black-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-munsell-blue-200 focus:border-transparent transition-all"
                  placeholder="admin@marketplace.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-matt-black-200 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-matt-black-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white-chalk-100 border border-matt-black-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-munsell-blue-200 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-munsell-blue-100 focus:ring-munsell-blue-200 border-matt-black-500/50" />
                <span className="text-matt-black-300">Remember me</span>
              </label>
              <a href="#" className="text-munsell-blue-100 font-medium hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-munsell-blue-100 hover:bg-munsell-blue-200 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm shadow-munsell-blue-200/50 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in to Dashboard"}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>

        <p className="text-center text-matt-black-400 text-sm mt-8">
          &copy; {new Date().getFullYear()} Marketplace Admin. All rights reserved.
        </p>
      </div>
    </div>
  );
}
