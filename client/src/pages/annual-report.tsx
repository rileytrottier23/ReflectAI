import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, TrendingUp, Brain, Target, Loader2, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface AnnualCounselorReport {
  recommendations: string[];
  annualScore: number;
  detailedAnalysis: string;
}

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

function SavedReportCard({ saved }: { saved: SavedReport }) {
  const [expanded, setExpanded] = useState(false);
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
              <p className="font-medium text-black text-sm">{saved.year} Annual Report</p>
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Year-in-Review</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{saved.detailedAnalysis}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Goals</p>
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

export default function AnnualReport() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<AnnualCounselorReport | null>(null);

  const { data: entries } = useQuery({
    queryKey: ["/api/journal/entries"],
    enabled: !!user,
  });

  const { data: savedReports = [] } = useQuery<SavedReport[]>({
    queryKey: ["/api/counselor/reports/annual"],
    enabled: !!user,
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({ year }: { year: number }): Promise<AnnualCounselorReport> => {
      const response = await fetch("/api/counselor/annual-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
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
    onSuccess: (data: AnnualCounselorReport) => {
      setReport(data);
      queryClient.invalidateQueries({ queryKey: ["/api/counselor/reports/annual"] });
      toast({
        title: "Annual report ready",
        description: "Your annual counselor report has been generated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to generate report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
    }
  }, [user, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-beige-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const allEntries = Array.isArray(entries) ? entries : [];

  const yearEntries = allEntries.filter((entry: any) => {
    return new Date(entry.date).getFullYear() === selectedYear;
  });

  const averageHappiness = yearEntries.length > 0
    ? (yearEntries.reduce((sum: number, e: any) => sum + e.happinessScore, 0) / yearEntries.length).toFixed(1)
    : "0.0";

  const now = new Date();
  const isCurrentYear = selectedYear === now.getFullYear();
  const isEndOfYear = now.getMonth() === 11 && now.getDate() >= 28;
  const canGenerate = yearEntries.length >= 30 && (!isCurrentYear || isEndOfYear);

  const handleGenerateReport = () => {
    if (isCurrentYear && !isEndOfYear) {
      toast({
        title: "Report not available yet",
        description: "Annual reports can only be generated at year end (after December 28th)",
        variant: "destructive",
      });
      return;
    }
    if (yearEntries.length < 30) {
      toast({
        title: "Not enough entries",
        description: `You need at least 30 journal entries to generate an annual report. You have ${yearEntries.length} entries for ${selectedYear}.`,
        variant: "destructive",
      });
      return;
    }
    generateReportMutation.mutate({ year: selectedYear });
  };

  const availableYears = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="min-h-screen bg-beige-200">
      <NavigationHeader currentTab="reports" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-semibold text-black mb-2">
            Annual Counselor Report
          </h2>
          <p className="text-gray-800">
            Get a comprehensive AI-powered year-in-review based on your full year of journal entries and mood patterns.
          </p>
        </div>

        {/* Report Generation Controls */}
        <Card className="border-beige-300 bg-white shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="font-display text-black flex items-center gap-2">
              <Brain className="h-5 w-5 text-sage-600" />
              Generate Annual Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => { setSelectedYear(parseInt(value)); setReport(null); }}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
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
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Entries for {selectedYear}</span>
                  <span className="font-medium">{yearEntries.length}</span>
                </div>
                <div className="text-xs">
                  {yearEntries.length < 30 && (
                    <span className="text-amber-600">Need {30 - yearEntries.length} more entries to generate an annual report</span>
                  )}
                  {yearEntries.length >= 30 && isCurrentYear && !isEndOfYear && (
                    <span className="text-amber-600">Annual reports available at year end (after December 28th)</span>
                  )}
                  {yearEntries.length >= 30 && (!isCurrentYear || isEndOfYear) && (
                    <span className="text-sage-600">Annual report can be generated</span>
                  )}
                </div>
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
                  Generating Annual Report...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Annual Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Generated Report */}
        {report && (
          <div className="space-y-8">
            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-black flex items-center gap-2">
                  <Brain className="h-5 w-5 text-sage-600" />
                  {selectedYear} Year-in-Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.detailedAnalysis}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-black flex items-center gap-2">
                  <Target className="h-5 w-5 text-sage-600" />
                  Goals for {selectedYear + 1}
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
                  <p className="text-sm font-medium text-gray-600">Entries in {selectedYear}</p>
                  <p className="text-2xl font-semibold text-black">{yearEntries.length}</p>
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

          {report && (
            <Card className="border-beige-300 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Annual Wellbeing Score</p>
                    <p className="text-2xl font-semibold text-black">{report.annualScore}/10</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-sage-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {!report && (
            <Card className="border-beige-300 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Annual Wellbeing Score</p>
                    <p className="text-2xl font-semibold text-black">—</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-sage-600" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Previously Generated Reports */}
        {savedReports.length > 0 && (
          <div className="mt-12">
            <div className="mb-4">
              <h3 className="text-xl font-display font-semibold text-black flex items-center gap-2">
                <Clock className="h-5 w-5 text-sage-600" />
                Previously Generated Reports
              </h3>
              <p className="text-sm text-gray-600 mt-1">Click any report to expand and read the full year-in-review.</p>
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
