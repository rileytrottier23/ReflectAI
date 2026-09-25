import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { authClient } from "@/lib/auth-client";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const appUrl = (path: string) => `${window.location.origin}${basePath}${path}`;

const inputClass =
  "h-11 w-full rounded-xl border border-[#cfd9ca] bg-white px-3.5 text-[0.95rem] text-[#1f2a1d] shadow-[inset_0_1px_2px_rgba(31,51,38,0.04)] outline-none transition-shadow placeholder:text-[#9aa896] hover:border-[#b3c3ab] focus:border-[#4a6741] focus:ring-4 focus:ring-[#4a6741]/15";
const primaryButtonClass =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4a6741] text-[0.95rem] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(74,103,65,0.55)] transition-colors hover:bg-[#3c5535] active:bg-[#334a2d] disabled:cursor-not-allowed disabled:opacity-70";
const linkClass = "font-semibold text-[#c2703d] hover:text-[#a55a2b]";

function useAuthOptions() {
  return useQuery<{ google: boolean }>({
    queryKey: ["/api/auth-options"],
    staleTime: Infinity,
  });
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.02em] text-[#1f2a1d]">
        {title}
      </h1>
      <p className="mt-1 text-[0.95rem] text-[#5b6858]">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  action,
  ...props
}: { label: string; action?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-sm font-medium text-[#2c3a29]">
        {label}
        {action}
      </span>
      <input className={inputClass} {...props} />
    </label>
  );
}

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-[#efd5c4] bg-[#fbf3ee] px-3.5 py-2.5 text-sm text-[#5a3a26]">
      {message}
    </p>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function GoogleSection({ onError }: { onError: (message: string) => void }) {
  const { data } = useAuthOptions();
  const [pending, setPending] = useState(false);

  if (!data?.google) return null;

  const signInWithGoogle = async () => {
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: appUrl("/journal"),
      errorCallbackURL: appUrl("/sign-in"),
    });
    if (error) {
      setPending(false);
      onError(error.message ?? "Couldn't start Google sign-in. Please try again.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#cfd9ca] bg-white font-medium text-[#1f2a1d] shadow-[0_1px_2px_rgba(31,51,38,0.06)] transition-colors hover:border-[#b3c3ab] hover:bg-[#f4f7f2] disabled:opacity-70"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <GoogleIcon />}
        Continue with Google
      </button>
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-[#7a8776]">
        <span className="h-px flex-1 bg-[#dbe3d6]" />
        or
        <span className="h-px flex-1 bg-[#dbe3d6]" />
      </div>
    </>
  );
}

function CheckEmail({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3eb] text-[#4a6741] ring-1 ring-[#cfd9ca]">
        <MailCheck className="h-6 w-6" aria-hidden="true" />
      </span>
      <Header title="Check your email" subtitle={`We sent a link to ${email}.`} />
      <p className="text-[0.95rem] leading-relaxed text-[#5b6858]">{children}</p>
      <p className="text-[0.95rem] text-[#5b6858]">
        <Link href="/sign-in" className={linkClass}>
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function SignInPage() {
  const search = new URLSearchParams(useSearch());
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [error, setError] = useState<string | null>(
    search.get("error") ? "That sign-in didn't work. Please try again." : null,
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: appUrl("/journal"),
    });
    setPending(false);
    if (!error) {
      setLocation("/journal");
    } else if (error.status === 403) {
      // Better Auth re-sends the verification email on this attempt.
      setUnverified(true);
    } else {
      setError(error.message ?? "Couldn't sign you in. Please try again.");
    }
  };

  if (unverified) {
    return (
      <AuthShell>
        <CheckEmail email={email}>
          Your email address isn&rsquo;t confirmed yet. Open the link we just sent to finish signing in.
        </CheckEmail>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <Header title="Welcome back" subtitle="Sign in to continue your journaling journey" />
        <GoogleSection onError={setError} />
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            action={
              <Link href="/forgot-password" className="text-sm font-medium text-[#c2703d] hover:text-[#a55a2b]">
                Forgot password?
              </Link>
            }
          />
          <ErrorMessage message={error} />
          <SubmitButton pending={pending}>Sign in</SubmitButton>
        </form>
        <p className="text-[0.95rem] text-[#5b6858]">
          Don&rsquo;t have an account?{" "}
          <Link href="/sign-up" className={linkClass}>
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: appUrl("/journal"),
    });
    setPending(false);
    if (error) {
      setError(error.message ?? "Couldn't create your account. Please try again.");
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <CheckEmail email={email}>
          Open the link in that email to confirm your address, and you&rsquo;ll be taken straight to your journal.
        </CheckEmail>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <Header title="Create your account" subtitle="Start your mindful reflection practice" />
        <GoogleSection onError={setError} />
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="Name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
          />
          <Field
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 10 characters"
          />
          <ErrorMessage message={error} />
          <SubmitButton pending={pending}>Create account</SubmitButton>
        </form>
        <p className="text-[0.95rem] text-[#5b6858]">
          Already have an account?{" "}
          <Link href="/sign-in" className={linkClass}>
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: appUrl("/reset-password"),
    });
    setPending(false);
    if (error) {
      setError(error.message ?? "Couldn't send the reset email. Please try again.");
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <CheckEmail email={email}>
          If there&rsquo;s an account for that address, the email has a link to choose a new password. It expires in an hour.
        </CheckEmail>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <Header title="Reset your password" subtitle="We'll email you a link to choose a new one." />
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <ErrorMessage message={error} />
          <SubmitButton pending={pending}>Send reset link</SubmitButton>
        </form>
        <p className="text-[0.95rem] text-[#5b6858]">
          Remembered it?{" "}
          <Link href="/sign-in" className={linkClass}>
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const search = new URLSearchParams(useSearch());
  const token = search.get("token");
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    !token || search.get("error") ? "This reset link is invalid or has expired. Request a new one." : null,
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (error) {
      setError(error.message ?? "Couldn't reset your password. Please request a new link.");
    } else {
      setLocation("/sign-in");
    }
  };

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <Header title="Choose a new password" subtitle="Use at least 10 characters." />
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 10 characters"
            disabled={!token}
          />
          <ErrorMessage message={error} />
          <SubmitButton pending={pending}>Save password</SubmitButton>
        </form>
        <p className="text-[0.95rem] text-[#5b6858]">
          <Link href="/forgot-password" className={linkClass}>
            Request a new link
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
