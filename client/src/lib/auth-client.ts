import { createAuthClient } from "better-auth/react";

// Same-origin: Better Auth is served by our Express app at /api/auth.
export const authClient = createAuthClient();

export function useAuth() {
  const { data, isPending } = authClient.useSession();
  return {
    isLoaded: !isPending,
    isSignedIn: !!data?.user,
    user: data?.user ?? null,
  };
}
