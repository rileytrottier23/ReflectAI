import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import Journal from "@/pages/journal";
import CounselorReports from "@/pages/counselor-reports";
import Auth from "@/pages/auth";
import PrivacyPolicy from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      {isLoading || !user ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Journal} />
          <Route path="/journal" component={Journal} />
          <Route path="/counselor-reports" component={CounselorReports} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div>
      <h1>React App Loading Test</h1>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
