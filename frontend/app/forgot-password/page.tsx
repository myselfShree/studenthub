"use client";

import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please wait a minute before trying again.");
        return;
      }

      // Always show success — backend never reveals whether an email is registered
      setSubmitted(true);
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
          <p className="mt-1 text-sm text-[#8D8777]">Password recovery</p>
        </div>

        <div className="sh-glass rounded-2xl border border-[#36362F] p-8">
          {submitted ? (
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
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75M21.75 6.75L12 13.5 2.25 6.75M21.75 6.75A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25"
                  />
                </svg>
              </div>
              <p className="text-[#F0EDE6] font-semibold">Check your inbox</p>
              <p className="text-sm text-[#8D8777] leading-relaxed">
                If an account exists for{" "}
                <span className="text-[#F0EDE6]">{email}</span>, you&apos;ll
                receive a reset link within a minute. The link is valid for 30
                minutes.
              </p>
              <p className="text-xs text-[#57564F]">
                Don&apos;t see it? Check your spam folder.
              </p>
              <Link
                href="/login"
                className="block mt-4 text-sm text-[#8E9B7A] hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-[#F0EDE6] font-semibold mb-1">
                  Forgot your password?
                </p>
                <p className="text-sm text-[#8D8777] leading-relaxed">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

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

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="sh-btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>

              <p className="text-center text-xs text-[#57564F]">
                Remember it?{" "}
                <Link href="/login" className="text-[#8E9B7A] hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
