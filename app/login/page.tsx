"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@jrc.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    window.location.href = "/jobs";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-semibold">JRC Shop Card</h1>
        <p className="mt-1 text-center text-sm text-zinc-500">Sign in to continue</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-3 text-base"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Password</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-3 text-base"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="min-h-11 w-full touch-manipulation rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white active:bg-zinc-950 sm:hover:bg-zinc-800"
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-400">
          Demo: demo@jrc.local / demo123 (after running seed)
        </p>
      </div>
      <Link href="/" className="mt-6 text-sm text-zinc-500 hover:text-zinc-800">
        Home
      </Link>
    </div>
  );
}
