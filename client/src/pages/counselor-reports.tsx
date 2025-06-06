import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, TrendingUp } from "lucide-react";

export default function CounselorReports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/journal/entries"],
    enabled: isAuthenticated,
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate stats from entries
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthlyEntries = entries?.filter((entry: any) => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() + 1 === currentMonth && entryDate.getFullYear() === currentYear;
  }) || [];

  const averageHappiness = monthlyEntries.length > 0 
    ? (monthlyEntries.reduce((sum: number, entry: any) => sum + entry.happinessScore, 0) / monthlyEntries.length).toFixed(1)
    : "0.0";

  const bestDay = monthlyEntries.reduce((best: any, entry: any) => 
    !best || entry.happinessScore > best.happinessScore ? entry : best, null);

  const currentStreak = calculateStreak(entries || []);

  return (
    <div className="min-h-screen bg-cream-100">
      <NavigationHeader currentTab="reports" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-semibold text-gray-800 mb-2">
            Counselor Reports
          </h2>
          <p className="text-gray-600">
            Get AI-powered insights and monthly summaries based on your journal entries and mood patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Report */}
          <Card className="border-cream-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">Monthly Summary</CardTitle>
                <Select defaultValue={`${currentYear}-${currentMonth.toString().padStart(2, '0')}`}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={`${currentYear}-${currentMonth.toString().padStart(2, '0')}`}>
                      {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-sage-50 rounded-lg">
                <h4 className="font-medium text-sage-800 mb-2">Overall Mood Trend</h4>
                <p className="text-sm text-sage-700">
                  Your average happiness score this month was {averageHappiness}/10
                  {monthlyEntries.length > 0 ? ", showing consistent journaling habits." : "."}
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Key Insights</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• {monthlyEntries.length} journal entries this month</li>
                  <li>• Regular reflection supports emotional awareness</li>
                  <li>• Consistent tracking helps identify patterns</li>
                </ul>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">Recommendations</h4>
                <p className="text-sm text-amber-700">
                  {monthlyEntries.length === 0 
                    ? "Start by writing your first journal entry to begin tracking your emotional journey."
                    : "Continue your journaling practice to build deeper insights over time."
                  }
                </p>
              </div>
              
              <Button className="w-full bg-sage-500 hover:bg-sage-600 text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Detailed Report
              </Button>
            </CardContent>
          </Card>

          {/* Mood Visualization */}
          <Card className="border-cream-200">
            <CardHeader>
              <CardTitle className="font-display">Mood Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Average Happiness Score</span>
                  <span className="text-2xl font-bold text-sage-600">{averageHappiness}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-sage-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${(parseFloat(averageHappiness) / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Entries this month</span>
                  <span className="font-medium text-gray-800">{monthlyEntries.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current streak</span>
                  <span className="font-medium text-gray-800">{currentStreak} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Best day</span>
                  <span className="font-medium text-gray-800">
                    {bestDay 
                      ? `${new Date(bestDay.date).toLocaleDateString()} (${bestDay.happinessScore}/10)`
                      : "No entries yet"
                    }
                  </span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  <BarChart3 className="inline w-4 h-4 text-sage-500 mr-2" />
                  Advanced analytics and visualizations will be available once AI integration is complete.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Helper function to calculate current streak
function calculateStreak(entries: any[]): number {
  if (!entries || entries.length === 0) return 0;
  
  const sortedEntries = entries
    .map(entry => new Date(entry.date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i]);
    entryDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (entryDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
