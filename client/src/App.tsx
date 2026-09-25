import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth-client";
import Landing from "@/pages/landing";
import Journal from "@/pages/journal";
import CounselorReports from "@/pages/counselor-reports";
import AnnualReport from "@/pages/annual-report";
import PrivacyPolicy from "@/pages/privacy-policy";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";
import { SignInPage, SignUpPage, ForgotPasswordPage, ResetPasswordPage } from "@/pages/auth";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#E0E0E0] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7D9371]"></div>
    </div>
  );
}

// Invalidates React Query cache when signed-in user changes
function AuthQueryClientCacheInvalidator() {
  const { isLoaded, user } = useAuth();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;
    const userId = user?.id ?? null;
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
      qc.clear();
    }
    prevUserIdRef.current = userId;
  }, [isLoaded, user?.id, qc]);

  return null;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  return isSignedIn ? <Redirect to="/journal" /> : <Landing />;
}

// Auth pages are for signed-out visitors; send signed-in users to their journal.
function GuestRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  return isSignedIn ? <Redirect to="/journal" /> : <Component />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  return <Component />;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthQueryClientCacheInvalidator />
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in" component={() => <GuestRoute component={SignInPage} />} />
            <Route path="/sign-up" component={() => <GuestRoute component={SignUpPage} />} />
            <Route path="/forgot-password" component={() => <GuestRoute component={ForgotPasswordPage} />} />
            <Route path="/reset-password" component={ResetPasswordPage} />
            <Route path="/journal" component={() => <ProtectedRoute component={Journal} />} />
            <Route path="/counselor-reports" component={() => <ProtectedRoute component={CounselorReports} />} />
            <Route path="/annual-report" component={() => <ProtectedRoute component={AnnualReport} />} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/contact" component={Contact} />
            {/* Legacy routes — redirect to sign-in */}
            <Route path="/auth" component={() => <Redirect to="/sign-in" />} />
            <Route path="/sign-in/*" component={() => <Redirect to="/sign-in" />} />
            <Route path="/sign-up/*" component={() => <Redirect to="/sign-up" />} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
