import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Journal from "@/pages/journal";
import CounselorReports from "@/pages/counselor-reports";
import AnnualReport from "@/pages/annual-report";
import PrivacyPolicy from "@/pages/privacy-policy";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set in prod.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment");
}

// Sage green: #7D9371 (sage-600), neutral gray: #E0E0E0 (beige-200)
const clerkAppearance = {
  theme: shadcn,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/favicon.svg`,
  },
  variables: {
    colorPrimary: "#7D9371",
    colorForeground: "#000000",
    colorMutedForeground: "#444444",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#f5f5f5",
    colorInputForeground: "#000000",
    colorNeutral: "#D1D1D1",
    fontFamily: "Georgia, 'Times New Roman', serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "!bg-[#fffdf8] !border !border-[#d9e3d4] !rounded-[28px] w-[440px] max-w-full overflow-hidden !shadow-[0_24px_70px_rgba(67,86,61,0.14)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "!text-[#203020] !font-semibold",
    headerSubtitle: "!text-[#5e6d5b]",
    socialButtonsBlockButtonText: "!text-[#344434]",
    formFieldLabel: "!text-[#203020]",
    footerActionLink: "!text-[#637d58] hover:!text-[#496340]",
    footerActionText: "!text-[#5e6d5b]",
    dividerText: "!text-[#71806f]",
    identityPreviewEditButton: "!text-[#637d58]",
    formFieldSuccessText: "!text-[#637d58]",
    alertText: "!text-[#344434]",
    logoBox: "hidden",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "!border-[#d9e3d4] !bg-[#fbfdf9] hover:!bg-[#f1f6ee] !rounded-xl",
    formButtonPrimary: "!bg-[#718d66] hover:!bg-[#5f7a55] !text-white !rounded-xl !shadow-[0_8px_18px_rgba(95,122,85,0.2)]",
    formFieldInput: "!border-[#d9e3d4] !bg-[#fbfdf9] !text-[#203020] focus:!border-[#8aa27f] focus:!ring-[#cbdac6]",
    footerAction: "bg-transparent",
    dividerLine: "!bg-[#d9e3d4]",
    alert: "!bg-[#f3f7f1] !border-[#d9e3d4]",
    otpCodeFieldInput: "!border-[#d9e3d4]",
    formFieldRow: "",
    main: "",
  },
};

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] items-start justify-center overflow-y-auto bg-[#edf2eb] px-4">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#d5e4cf]/75 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#dce8d6]/80 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-white/45 blur-3xl" />
      </div>

      <main className="relative z-10 flex w-full max-w-[440px] flex-col items-center py-8 sm:py-12">
        <a
          href={basePath || "/"}
          className="group flex flex-col items-center text-center"
          aria-label="ReflectAI home"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#cbdac6] bg-[#f9fcf7] shadow-[0_8px_22px_rgba(67,86,61,0.12)] transition-transform duration-200 group-hover:-translate-y-0.5">
            <img
              src={`${window.location.origin}${basePath}/favicon.svg`}
              alt=""
              className="h-9 w-9"
            />
          </span>
          <span className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-[#203020]">
            ReflectAI
          </span>
          <span className="mt-1 text-sm text-[#5e6d5b]">
            Your personal journaling companion
          </span>
        </a>

        <div className="mt-8 w-full">{children}</div>

        <p className="mt-6 text-center text-xs tracking-wide text-[#71806f]">
          A private space to pause, reflect, and move forward.
        </p>
      </main>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </AuthShell>
  );
}

function SignUpPage() {
  return (
    <AuthShell>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </AuthShell>
  );
}

// Invalidates React Query cache when signed-in user changes
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/journal" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#E0E0E0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7D9371]"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  return <Component />;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to continue your journaling journey",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start your mindful reflection practice",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            {/* REQUIRED — /*? optional wildcard matches bare URL and Clerk OAuth sub-paths */}
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/journal" component={() => <ProtectedRoute component={Journal} />} />
            <Route path="/counselor-reports" component={() => <ProtectedRoute component={CounselorReports} />} />
            <Route path="/annual-report" component={() => <ProtectedRoute component={AnnualReport} />} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/contact" component={Contact} />
            {/* Legacy /auth route — redirect to sign-in */}
            <Route path="/auth" component={() => <Redirect to="/sign-in" />} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
