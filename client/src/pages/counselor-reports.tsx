import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Calendar, TrendingUp, Brain, Lightbulb, Target, Loader2, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface SavedReport {
  id: number;
  type: string;
  month: number | null;
  year: number;
  recommendations: string[];
  score: number;
  detailedAnalysis: string;
  createdAt: string;
}

interface CounselorReport {
  recommendations: string[];
  monthlyScore: number;
  detailedAnalysis: string;
}

function calculateLongestStreakForMonth(entries: any[]): number {
  if (!entries || entries.length === 0) return 0;
  
  const sortedEntries = entries
    .map(entry => new Date(entry.date))
    .sort((a, b) => a.getTime() - b.getTime());
  
  let longestStreak = 0;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedEntries.length; i++) {
    const prevDate = sortedEntries[i - 1];
    const currentDate = sortedEntries[i];
    
    const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  
  return Math.max(longestStreak, currentStreak);
}

function SavedReportCard({ saved }: { saved: SavedReport }) {
  const [expanded, setExpanded] = useState(false);
  const label = new Date(saved.year, (saved.month ?? 1) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const generatedOn = new Date(saved.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Card className="border-beige-300 bg-white shadow-sm">
      <CardContent className="p-4">
        <button
          className="w-full flex items-center justify-between text-left gap-3"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-sage-700">{saved.score}</span>
            </div>
            <div>
              <p className="font-medium text-black text-sm">{label}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Generated {generatedOn}
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-beige-200 pt-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Analysis</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{saved.detailedAnalysis}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommendations</p>
              <div className="space-y-2">
                {saved.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-beige-50 rounded-lg">
                    <div className="w-5 h-5 bg-sage-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-sm text-gray-800">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CounselorReports() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<CounselorReport | null>(null);

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/journal/entries"],
    enabled: !!user,
  });

  const { data: savedReports = [] } = useQuery<SavedReport[]>({
    queryKey: ["/api/counselor/reports/monthly"],
    enabled: !!user,
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }): Promise<CounselorReport> => {
      const response = await fetch("/api/counselor/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const text = await response.text();
        let message = text;
        try {
          const parsed = JSON.parse(text);
          if (parsed.message) {
            message = parsed.message;
          }
        } catch {
          message = "We couldn't generate your report right now. Please try again";
        }
        throw new Error(message);
      }
      
      return await response.json();
    },
    onSuccess: (data: CounselorReport) => {
      setReport(data);
      queryClient.invalidateQueries({ queryKey: ["/api/counselor/reports/monthly"] });
      toast({
        title: "Report ready",
        description: "Your counselor report has been generated",
      });
    },
    onError: (error) => {
      console.error("Error generating report:", error);
      toast({
        title: "Unable to generate report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Session expired",
        description: "Please log in again to continue",
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

  const handleGenerateReport = () => {
    // Check if it's the end of the selected month
    const now = new Date();
    const selectedDate = new Date(selectedYear, selectedMonth - 1);
    const isCurrentMonth = selectedDate.getFullYear() === now.getFullYear() && selectedDate.getMonth() === now.getMonth();
    const isEndOfMonth = now.getDate() >= 28; // Allow generation from 28th onwards
    
    if (isCurrentMonth && !isEndOfMonth) {
      toast({
        title: "Report not available yet",
        description: "Reports can only be generated at the end of the month (after the 28th)",
        variant: "destructive",
      });
      return;
    }
    
    // Check if there are at least 7 entries for the selected month
    const selectedMonthEntries = allEntries.filter((entry: any) => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() + 1 === selectedMonth && entryDate.getFullYear() === selectedYear;
    });
    
    if (selectedMonthEntries.length < 7) {
      toast({
        title: "Not enough entries",
        description: `You need at least 7 journal entries to generate a report. You have ${selectedMonthEntries.length} entries for this month.`,
        variant: "destructive",
      });
      return;
    }
    
    generateReportMutation.mutate({ month: selectedMonth, year: selectedYear });
  };

  // Calculate stats from entries
  const allEntries = Array.isArray(entries) ? entries : [];
  
  // Stats for selected month (for report generation)
  const selectedMonthEntries = allEntries.filter((entry: any) => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() + 1 === selectedMonth && entryDate.getFullYear() === selectedYear;
  });

  const averageHappiness = selectedMonthEntries.length > 0 
    ? (selectedMonthEntries.reduce((sum: number, entry: any) => sum + entry.happinessScore, 0) / selectedMonthEntries.length).toFixed(1)
    : "0.0";

  const longestStreak = calculateLongestStreakForMonth(selectedMonthEntries);

  return (
    <div className="min-h-screen bg-beige-200">
      <NavigationHeader currentTab="reports" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-semibold text-black mb-2">
            AI Counselor Reports
          </h2>
          <p className="text-gray-800">
            Get AI-powered insights and monthly summaries based on your journal entries and mood patterns.
          </p>
        </div>

        {/* Report Generation Controls */}
        <Card className="border-beige-300 bg-white shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="font-display text-black flex items-center gap-2">
              <Brain className="h-5 w-5 text-sage-600" />
              Generate AI Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Entry Count and Validation Status */}
            <div className="mb-4 p-3 bg-beige-50 rounded-lg">
              <div className="text-sm text-gray-700">
                {(() => {
                  const selectedMonthEntries = allEntries.filter((entry: any) => {
                    const entryDate = new Date(entry.date);
                    return entryDate.getMonth() + 1 === selectedMonth && entryDate.getFullYear() === selectedYear;
                  });
                  
                  const now = new Date();
                  const selectedDate = new Date(selectedYear, selectedMonth - 1);
                  const isCurrentMonth = selectedDate.getFullYear() === now.getFullYear() && selectedDate.getMonth() === now.getMonth();
                  const isEndOfMonth = now.getDate() >= 28;
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Entries for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="text-xs">
                        {selectedMonthEntries.length < 7 && (
                          <span className="text-amber-600">Need {7 - selectedMonthEntries.length} more entries to generate report</span>
                        )}
                        {selectedMonthEntries.length >= 7 && isCurrentMonth && !isEndOfMonth && (
                          <span className="text-amber-600">Reports available at month end (after 28th)</span>
                        )}
                        {selectedMonthEntries.length >= 7 && (!isCurrentMonth || isEndOfMonth) && (
                          <span className="text-sage-600">Report can be generated</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            <Button 
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              className="bg-sage-600 hover:bg-sage-700 text-white"
            >
              {generateReportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Generated Report */}
        {report && (
          <div className="space-y-8">
            {/* Detailed Analysis */}
            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-black flex items-center gap-2">
                  <Brain className="h-5 w-5 text-sage-600" />
                  AI Analysis Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.detailedAnalysis}</p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-black flex items-center gap-2">
                  <Target className="h-5 w-5 text-sage-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-beige-50 rounded-lg">
                      <div className="w-6 h-6 bg-sage-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-beige-300 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Selected Month Entries</p>
                  <p className="text-2xl font-semibold text-black">{selectedMonthEntries.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-sage-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-beige-300 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Happiness This Month</p>
                  <p className="text-2xl font-semibold text-black">{averageHappiness}/10</p>
                </div>
                <TrendingUp className="h-8 w-8 text-sage-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-beige-300 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Longest Streak</p>
                  <p className="text-2xl font-semibold text-black">{longestStreak} days</p>
                </div>
                <BarChart3 className="h-8 w-8 text-sage-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Previously Generated Reports */}
        {savedReports.length > 0 && (
          <div className="mt-12">
            <div className="mb-4">
              <h3 className="text-xl font-display font-semibold text-black flex items-center gap-2">
                <Clock className="h-5 w-5 text-sage-600" />
                Previously Generated Reports
              </h3>
              <p className="text-sm text-gray-600 mt-1">Click any report to expand and read the full analysis.</p>
            </div>
            <div className="space-y-3">
              {savedReports.map((saved) => (
                <SavedReportCard key={saved.id} saved={saved} />
              ))}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}