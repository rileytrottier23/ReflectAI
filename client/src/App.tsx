import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import Journal from "@/pages/journal";
import CounselorReports from "@/pages/counselor-reports";
import AnnualReport from "@/pages/annual-report";
import Auth from "@/pages/auth";
import PrivacyPolicy from "@/pages/privacy-policy";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/contact" component={Contact} />
      {user ? (
        <>
          <Route path="/" component={Journal} />
          <Route path="/journal" component={Journal} />
          <Route path="/counselor-reports" component={CounselorReports} />
          <Route path="/annual-report" component={AnnualReport} />
        </>
      ) : (
        <Route path="/" component={Landing} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
