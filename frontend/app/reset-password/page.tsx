"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

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
        "No reset token found in the URL. Please request a new link from the forgot password page."
      );
    }
  }, [token]);

  const validatePassword = (val: string): string | null => {
    if (val.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(val)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(val)) return "Password must contain at least one lowercase letter.";
    if (!/\d/.test(val)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/`~;']/.test(val)) {
      return "Password must contain at least one special character.";
    }
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("No valid reset token found. Please request a new link.");
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.detail ??
            "This reset link is invalid or has expired. Please request a new one."
        );
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Unable to connect to the authentication server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary,#11120D)] flex items-center justify-center px-4 py-12 transition-colors">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block transition-opacity hover:opacity-80">
            <span className="text-[var(--color-text-primary,#FFFBF4)] text-2xl font-bold tracking-tight font-display">
              Student Hub
            </span>
          </Link>
          <p className="mt-1 text-sm text-[var(--color-text-muted,#8D8777)]">Set new password</p>
        </div>

        <div className="bg-[var(--color-bg-surface,#1C1C17)] rounded-2xl border border-[var(--color-border,#36362F)] p-6 sm:p-8 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
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
              <p className="text-[var(--color-text-primary,#FFFBF4)] font-semibold text-base">Password updated</p>
              <p className="text-xs text-[var(--color-text-secondary,#D8CFBC)] leading-relaxed">
                Your password has been updated securely. Redirecting you to sign in…
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-xs text-[#8E9B7A] font-medium hover:underline"
              >
                Sign in now &rarr;
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-[var(--color-text-primary,#FFFBF4)] font-semibold text-sm mb-1">
                  Choose a new password
                </p>
                <p className="text-xs text-[var(--color-text-muted,#8D8777)]">
                  Must be at least 8 characters with upper, lower, number, and symbol.
                </p>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-3.5 py-2.5 pr-10
                               text-[var(--color-text-primary,#FFFBF4)] text-xs placeholder:text-[var(--color-text-muted,#57564F)]
                               focus:outline-none focus:border-[#8E9B7A] transition-colors"
                    placeholder="e.g. Shree@123"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted,#57564F)] hover:text-[var(--color-text-secondary,#8D8777)] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-3.5 py-2.5 pr-10
                               text-[var(--color-text-primary,#FFFBF4)] text-xs placeholder:text-[var(--color-text-muted,#57564F)]
                               focus:outline-none focus:border-[#8E9B7A] transition-colors"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted,#57564F)] hover:text-[var(--color-text-secondary,#8D8777)] transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-[rgba(199,106,94,0.12)] border border-[rgba(199,106,94,0.3)] text-[#C76A5E] text-xs leading-relaxed animate-fade-in">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full flex items-center justify-center gap-2 mt-3
                           bg-[var(--color-text-primary,#FFFBF4)] hover:bg-[#D8CFBC] text-[var(--color-bg-primary,#11120D)]
                           text-xs font-semibold rounded-lg py-2.5
                           border border-[var(--color-text-primary,#FFFBF4)] hover:border-[#D8CFBC]
                           transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? "Updating password…" : "Reset password"}
              </button>

              <p className="text-center text-xs text-[var(--color-text-muted,#57564F)] pt-1">
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
      <div className="min-h-screen bg-[var(--color-bg-primary,#11120D)] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#8E9B7A] border-t-transparent animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
