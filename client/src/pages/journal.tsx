import { useState } from "react";
import NavigationHeader from "@/components/navigation-header";
import CalendarWidget from "@/components/calendar-widget";
import JournalEntryForm from "@/components/journal-entry-form";
import Footer from "@/components/footer";

export default function Journal() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Auth is handled by ProtectedRoute wrapper in App.tsx

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
