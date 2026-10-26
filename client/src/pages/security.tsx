import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import NavigationHeader from "@/components/navigation-header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type Setup = { totpURI: string; backupCodes: string[]; qr: string };

function useHasPassword() {
  return useQuery({
    queryKey: ["auth-accounts"],
    queryFn: async () => {
      const { data } = await authClient.listAccounts();
      return (data ?? []).some((a) => a.providerId === "credential");
    },
  });
}

// The secret inside the otpauth:// URI, for typing into an app by hand.
function setupKey(uri: string): string {
  const secret = new URL(uri).searchParams.get("secret") ?? "";
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-red-700">
      {message}
    </p>
  );
}

export default function Security() {
  const { data: session, refetch } = authClient.useSession();
  const enabled = Boolean((session?.user as { twoFactorEnabled?: boolean } | undefined)?.twoFactorEnabled);
  const { data: hasPassword, isLoading: accountsLoading } = useHasPassword();

  const [password, setPassword] = useState("");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justEnabled, setJustEnabled] = useState(false);

  useEffect(() => {
    setError(null);
  }, [enabled]);

  const passwordBody = () => (hasPassword ? { password } : {}) as { password: string };

  const startSetup = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { data, error } = await authClient.twoFactor.enable({ ...passwordBody(), method: "totp" });
    if (error || !data || data.method !== "totp") {
      setPending(false);
      setError(error?.message ?? "Couldn't start setup. Please try again.");
      return;
    }
    const qr = await QRCode.toDataURL(data.totpURI, { margin: 1, width: 200 });
    setSetup({ totpURI: data.totpURI, backupCodes: data.backupCodes, qr });
    setPassword("");
    setPending(false);
  };

  const confirmSetup = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.twoFactor.verifyTotp({ code: code.replace(/\s+/g, "") });
    setPending(false);
    if (error) {
      setError(error.message ?? "That code didn't work. Check your app and try again.");
      return;
    }
    setCode("");
    setJustEnabled(true);
    await refetch();
  };

  const turnOff = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.twoFactor.disable(passwordBody());
    setPending(false);
    if (error) {
      setError(error.message ?? "Couldn't turn off two-factor. Please try again.");
      return;
    }
    setPassword("");
    setSetup(null);
    setJustEnabled(false);
    await refetch();
  };

  const passwordField = hasPassword ? (
    <div className="space-y-1.5">
      <Label htmlFor="current-password">Current password</Label>
      <Input
        id="current-password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-beige-200">
      <NavigationHeader currentTab="security" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">Security</h2>

        <Card className="border-beige-300 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {enabled ? (
                <ShieldCheck className="h-5 w-5 text-sage-600" aria-hidden="true" />
              ) : (
                <ShieldOff className="h-5 w-5 text-gray-500" aria-hidden="true" />
              )}
              Two-factor sign-in {enabled ? "is on" : "is off"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-[0.95rem] text-gray-700">
            <p>
              With two-factor on, signing in with your email and password also asks for a code from an
              authenticator app (such as Google Authenticator, 1Password or Authy). Signing in with Google
              uses Google&rsquo;s own security instead.
            </p>

            {accountsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-sage-600" aria-label="Loading" />
            ) : enabled && !setup ? (
              <form onSubmit={turnOff} className="space-y-4">
                {justEnabled && <p className="font-medium text-sage-700">Two-factor is on. You&rsquo;re all set.</p>}
                {passwordField}
                <ErrorText message={error} />
                <Button type="submit" variant="outline" disabled={pending}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Turn off two-factor
                </Button>
              </form>
            ) : setup && !enabled ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">1. Scan this with your authenticator app</p>
                  <img src={setup.qr} alt="QR code for your authenticator app" className="h-[200px] w-[200px] rounded border border-beige-300" />
                  <p className="text-sm">
                    Can&rsquo;t scan? Enter this key instead:{" "}
                    <code className="break-all rounded bg-beige-100 px-1.5 py-0.5 font-mono text-sm">{setupKey(setup.totpURI)}</code>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">2. Save your backup codes</p>
                  <p className="text-sm">
                    Each works once if you lose your phone. Keep them somewhere safe, like a password manager.
                    They won&rsquo;t be shown again.
                  </p>
                  <ul className="grid grid-cols-2 gap-1.5 rounded border border-beige-300 bg-beige-50 p-3 font-mono text-sm">
                    {setup.backupCodes.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <form onSubmit={confirmSetup} className="space-y-3">
                  <p className="font-medium text-gray-900">3. Enter the 6-digit code from the app</p>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="max-w-[12rem]"
                  />
                  <ErrorText message={error} />
                  <Button type="submit" disabled={pending} className="bg-sage-600 hover:bg-sage-700 text-white">
                    {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    Turn on two-factor
                  </Button>
                </form>
              </div>
            ) : (
              <form onSubmit={startSetup} className="space-y-4">
                {passwordField}
                <ErrorText message={error} />
                <Button type="submit" disabled={pending} className="bg-sage-600 hover:bg-sage-700 text-white">
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Set up two-factor
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
