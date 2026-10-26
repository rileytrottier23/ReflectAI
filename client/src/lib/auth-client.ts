import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

// Same-origin: Better Auth is served by our Express app at /api/auth.
// The sign-in page handles the two-factor step itself (see SignInPage).
export const authClient = createAuthClient({
  plugins: [twoFactorClient()],
});

export function useAuth() {
  const { data, isPending } = authClient.useSession();
  return {
    isLoaded: !isPending,
    isSignedIn: !!data?.user,
    user: data?.user ?? null,
  };
}
