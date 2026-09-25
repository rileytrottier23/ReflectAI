import { useEffect, useRef } from "react";
import { Lock, Sparkles } from "lucide-react";
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

// Palette: deep forest #1f3326, primary green #4a6741 (AA contrast with white),
// warm terracotta accent #c2703d, paper #fffdf8.
const clerkAppearance = {
  theme: shadcn,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/favicon.svg`,
  },
  variables: {
    colorPrimary: "#4a6741",
    colorForeground: "#1f2a1d",
    colorMutedForeground: "#5b6858",
    colorDanger: "#c2413d",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#1f2a1d",
    colorNeutral: "#9aa896",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: "0.9375rem",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "!w-full !max-w-none !bg-transparent !border-0 !shadow-none !rounded-none overflow-visible",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none !p-0 !gap-6",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none !p-0 [&>div:last-child]:opacity-60",
    header: "!items-start !text-left",
    headerTitle: "!font-['Playfair_Display',serif] !text-[2rem] !leading-tight !font-semibold !tracking-[-0.02em] !text-[#1f2a1d]",
    headerSubtitle: "!text-[0.95rem] !text-[#5b6858]",
    socialButtonsBlockButton:
      "!h-11 !border !border-[#cfd9ca] !bg-white hover:!bg-[#f4f7f2] hover:!border-[#b3c3ab] !rounded-xl !shadow-[0_1px_2px_rgba(31,51,38,0.06)] transition-colors",
    socialButtonsBlockButtonText: "!font-medium !text-[#1f2a1d]",
    dividerLine: "!bg-[#dbe3d6]",
    dividerText: "!text-[#7a8776] !text-xs !uppercase !tracking-[0.14em]",
    formFieldLabel: "!font-medium !text-[#2c3a29]",
    formFieldInput:
      "!h-11 !border !border-[#cfd9ca] !bg-white !text-[#1f2a1d] placeholder:!text-[#9aa896] !rounded-xl !shadow-[inset_0_1px_2px_rgba(31,51,38,0.04)] hover:!border-[#b3c3ab] focus:!border-[#4a6741] focus:!ring-4 focus:!ring-[#4a6741]/15 transition-shadow",
    formButtonPrimary:
      "!h-11 !bg-[#4a6741] hover:!bg-[#3c5535] active:!bg-[#334a2d] !text-white !font-semibold !text-[0.95rem] !rounded-xl !shadow-[0_10px_24px_-8px_rgba(74,103,65,0.55)] transition-colors",
    footerAction: "!bg-transparent !justify-start",
    footerActionText: "!text-[#5b6858]",
    footerActionLink: "!font-semibold !text-[#c2703d] hover:!text-[#a55a2b]",
    identityPreviewEditButton: "!text-[#c2703d]",
    formFieldSuccessText: "!text-[#4a6741]",
    formFieldAction: "!text-[#c2703d] hover:!text-[#a55a2b]",
    alert: "!bg-[#fbf3ee] !border-[#efd5c4] !rounded-xl",
    alertText: "!text-[#5a3a26]",
    otpCodeFieldInput: "!border-[#cfd9ca] focus:!border-[#4a6741]",
    logoBox: "hidden",
    logoImage: "h-10 w-10",
    formFieldRow: "",
    main: "",
  },
};

const moods = [
  { label: "Calm", className: "bg-[#dfe9d8] text-[#2f4a2a]" },
  { label: "Hopeful", className: "bg-[#f6e3d3] text-[#7a4222]" },
  { label: "Tired", className: "bg-white/10 text-[#e4ecdf]" },
];

function BrandMark({ tone }: { tone: "light" | "dark" }) {
  const light = tone === "light";
  return (
    <a
      href={basePath || "/"}
      className="group inline-flex items-center gap-3"
      aria-label="ReflectAI home"
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:-rotate-6 ${
          light ? "bg-white/10 ring-1 ring-white/15" : "bg-[#eef3eb] ring-1 ring-[#cfd9ca]"
        }`}
      >
        <img src={`${window.location.origin}${basePath}/favicon.svg`} alt="" className="h-6 w-6" />
      </span>
      <span
        className={`font-display text-2xl font-semibold tracking-[-0.02em] ${
          light ? "text-[#f5f1e8]" : "text-[#1f2a1d]"
        }`}
      >
        ReflectAI
      </span>
    </a>
  );
}

function AuthShowcase() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#1f3326] text-[#e4ecdf] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#4a6741]/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full bg-[#c2703d]/25 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <div className="relative">
        <BrandMark tone="light" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <h2 className="font-display text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-[#f5f1e8] xl:text-[2.75rem]">
          Write freely.
          <br />
          <span className="italic text-[#e9a77a]">Understand yourself</span>
          <br />
          a little better.
        </h2>
        <p className="mt-4 max-w-sm font-sans text-[0.95rem] leading-relaxed text-[#b9c7b3]">
          Journal in your own words and get gentle reflections on what you&rsquo;re feeling, day by day.
        </p>

        <div className="relative mt-10">
          <figure className="rotate-[-1.5deg] rounded-2xl bg-[#fffdf8] p-6 text-[#2c3a29] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
            <figcaption className="flex items-center justify-between font-sans text-xs font-medium uppercase tracking-[0.14em] text-[#8a9686]">
              <span>Tuesday evening</span>
              <span className="rounded-full bg-[#dfe9d8] px-2.5 py-1 normal-case tracking-normal text-[#2f4a2a]">
                Calm
              </span>
            </figcaption>
            <blockquote className="mt-3 text-[1.05rem] leading-relaxed">
              Long day, but I finally went for that walk by the river. Noticed I wasn&rsquo;t
              replaying the meeting in my head for once&hellip;
            </blockquote>
          </figure>

          <div className="relative -mt-4 ml-8 rotate-[1deg] rounded-2xl border border-white/10 bg-[#2b4432]/95 p-5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#e9a77a]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Reflection
            </div>
            <p className="mt-2 font-sans text-sm leading-relaxed text-[#dfe7da]">
              Time outside seems to quiet your thoughts. This is the third entry this month where a
              walk shifted your mood.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-2 font-sans text-xs">
        <span className="mr-1 text-[#8fa189]">This week:</span>
        {moods.map((m) => (
          <span key={m.label} className={`rounded-full px-3 py-1 font-medium ${m.className}`}>
            {m.label}
          </span>
        ))}
      </div>
    </aside>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] bg-[#fbf8f1] font-sans lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthShowcase />

      <main className="relative flex flex-col px-4 py-8 sm:px-8 lg:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#dfe9d8] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#f6e3d3]/70 blur-3xl" />
        </div>

        <div className="relative lg:hidden">
          <BrandMark tone="dark" />
        </div>

        <div className="relative mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          {children}
        </div>

        <p className="relative flex items-center justify-center gap-1.5 text-center text-xs text-[#7a8776]">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
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
