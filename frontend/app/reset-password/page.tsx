"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(
        "No reset token found in the URL. Please use the link from your email."
      );
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.detail ??
            "This link is invalid or has expired. Please request a new one."
        );
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
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
          <p className="mt-1 text-sm text-[#8D8777]">Set new password</p>
        </div>

        <div className="sh-glass rounded-2xl border border-[#36362F] p-8">
          {success ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#8E9B7A]/15 border border-[#8E9B7A]/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#8E9B7A]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-[#F0EDE6] font-semibold">Password updated</p>
              <p className="text-sm text-[#8D8777] leading-relaxed">
                Your password has been reset successfully. Redirecting you to
                sign in…
              </p>
              <Link
                href="/login"
                className="block mt-2 text-sm text-[#8E9B7A] hover:underline"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-[#F0EDE6] font-semibold mb-1">
                  Choose a new password
                </p>
                <p className="text-sm text-[#8D8777]">
                  Must be at least 6 characters.
                </p>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#8D8777] uppercase tracking-widest">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
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
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#8D8777] uppercase tracking-widest">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full bg-[#11120D] border border-[#36362F] rounded-lg px-4 py-3 pr-11
                               text-[#F0EDE6] text-sm placeholder:text-[#57564F]
                               focus:outline-none focus:border-[#8E9B7A] transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-[#57564F] hover:text-[#8D8777] transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="sh-btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving…" : "Reset password"}
              </button>

              <p className="text-center text-xs text-[#57564F]">
                <Link
                  href="/forgot-password"
                  className="text-[#8E9B7A] hover:underline"
                >
                  Request a new link
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#11120D] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#8E9B7A] border-t-transparent animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
