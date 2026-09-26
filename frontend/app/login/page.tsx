"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail ?? "Login failed. Please try again.");
        return;
      }

      localStorage.setItem("studenthub_token", data.access_token);
      localStorage.setItem("studenthub_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Unable to connect. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#11120D] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-[#F0EDE6] text-2xl font-bold tracking-tight">
            Student Hub
          </span>
          <p className="mt-1 text-sm text-[#8D8777]">Sign in to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="sh-glass rounded-2xl border border-[#36362F] p-8 space-y-5"
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#8D8777] uppercase tracking-widest">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#11120D] border border-[#36362F] rounded-lg px-4 py-3
                         text-[#F0EDE6] text-sm placeholder:text-[#57564F]
                         focus:outline-none focus:border-[#8E9B7A] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#8D8777] uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#11120D] border border-[#36362F] rounded-lg px-4 py-3 pr-11
                           text-[#F0EDE6] text-sm placeholder:text-[#57564F]
                           focus:outline-none focus:border-[#8E9B7A] transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-[#57564F] hover:text-[#8D8777] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-[#8D8777] hover:text-[#8E9B7A] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="sh-btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-xs text-[#57564F]">
            No account?{" "}
            <Link href="/register" className="text-[#8E9B7A] hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
