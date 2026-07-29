"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("That email and password combination was not recognized.");
      return;
    }

    router.refresh();
    router.push("/pending");
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Sign in to your passbook
      </h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Use the email and password you registered with.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5"
        suppressHydrationWarning
      >
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <Input
            id="password"
            label="Password"
            // Dynamically change the input type!
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button" 
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute bottom-2.5 right-3 text-ink-muted transition-colors hover:text-cooperative focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="w-full py-3"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center font-body text-sm text-ink-muted">
        New here?{" "}
        <Link
          href="/register"
          className="font-medium text-cooperative hover:underline"
        >
          Register with an invite code
        </Link>
      </p>
      <div className="flex justify-center items-center">
        <label htmlFor="password">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-cooperative hover:underline"
          >
            Forgot password?
          </Link>
        </label>
      </div>
    </>
  );
}
