import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import NavigationHeader from "@/components/navigation-header";
import CalendarWidget from "@/components/calendar-widget";
import JournalEntryForm from "@/components/journal-entry-form";
import Footer from "@/components/footer";

export default function Journal() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-beige-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-beige-200">
      <NavigationHeader currentTab="journal" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-semibold text-black mb-2">
            Keep your thoughts organized
          </h2>
          <p className="text-gray-800">
            ReflectAI helps you record daily reflections and gain insights through personalized analytics and monthly summaries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <CalendarWidget selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          </div>
          
          <div className="lg:col-span-2">
            <JournalEntryForm selectedDate={selectedDate} />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
