import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Calendar, TrendingUp, Brain, Lightbulb, Target, Loader2 } from "lucide-react";

interface CounselorReport {
  overallMoodTrend: string;
  keyInsights: string[];
  recommendations: string[];
  emotionalPatterns: string;
  monthlyScore: number;
  summary: string;
}

export default function CounselorReports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<CounselorReport | null>(null);

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/journal/entries"],
    enabled: isAuthenticated,
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data: CounselorReport) => {
      setReport(data);
      toast({
        title: "Report Generated",
        description: "Your AI counselor report has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate counselor report. Please try again.",
        variant: "destructive",
      });
    },
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
      <div className="min-h-screen bg-beige-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
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
        title: "Report Not Available",
        description: "Counselor reports can only be generated at the end of the month (after the 28th).",
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
        title: "Insufficient Entries",
        description: `You need at least 7 journal entries to generate a counselor report. You currently have ${selectedMonthEntries.length} entries for this month.`,
        variant: "destructive",
      });
      return;
    }
    
    generateReportMutation.mutate({ month: selectedMonth, year: selectedYear });
  };

  // Calculate stats from entries
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const allEntries = Array.isArray(entries) ? entries : [];
  const monthlyEntries = allEntries.filter((entry: any) => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() + 1 === currentMonth && entryDate.getFullYear() === currentYear;
  });

  const averageHappiness = monthlyEntries.length > 0 
    ? (monthlyEntries.reduce((sum: number, entry: any) => sum + entry.happinessScore, 0) / monthlyEntries.length).toFixed(1)
    : "0.0";

  const currentStreak = calculateStreak(allEntries);

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
                        <span>Entries for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}:</span>
                        <span className={`font-medium ${selectedMonthEntries.length >= 7 ? 'text-sage-600' : 'text-amber-600'}`}>
                          {selectedMonthEntries.length} / 7 required
                        </span>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Overall Summary */}
            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-black flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-sage-600" />
                  Monthly Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-sage-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sage-800">Emotional Health Score</h4>
                    <Badge variant="secondary" className="bg-sage-100 text-sage-800">
                      {report.monthlyScore}/10
                    </Badge>
                  </div>
                  <Progress value={report.monthlyScore * 10} className="h-2 mb-2" />
                  <p className="text-sm text-sage-700">{report.overallMoodTrend}</p>
                </div>
                
                <div className="p-4 bg-beige-50 rounded-lg">
                  <h4 className="font-medium text-black mb-2">Summary</h4>
                  <p className="text-sm text-gray-700">{report.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-black flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-sage-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.keyInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-sage-50 rounded-lg">
                      <div className="w-6 h-6 bg-sage-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm text-sage-800">{insight}</p>
                    </div>
                  ))}
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
                      <div className="w-6 h-6 bg-leather-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm text-leather-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Emotional Patterns */}
            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-black flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-sage-600" />
                  Emotional Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-sage-50 rounded-lg">
                  <p className="text-sm text-sage-800">{report.emotionalPatterns}</p>
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
                  <p className="text-sm font-medium text-gray-600">This Month's Entries</p>
                  <p className="text-2xl font-semibold text-black">{monthlyEntries.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-sage-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-beige-300 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Happiness</p>
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
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-2xl font-semibold text-black">{currentStreak} days</p>
                </div>
                <BarChart3 className="h-8 w-8 text-sage-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function calculateStreak(entries: any[]): number {
  if (!entries || entries.length === 0) return 0;
  
  const sortedEntries = entries
    .map(entry => new Date(entry.date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const entryDate of sortedEntries) {
    const entryDateNormalized = new Date(entryDate);
    entryDateNormalized.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate.getTime() - entryDateNormalized.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
    } else if (diffDays === streak + 1) {
      continue;
    } else {
      break;
    }
  }
  
  return streak;
}