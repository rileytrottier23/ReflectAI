import OpenAI from "openai";
import type { JournalEntry } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface CounselorReport {
  overallMoodTrend: string;
  keyInsights: string[];
  recommendations: string[];
  emotionalPatterns: string;
  monthlyScore: number;
  summary: string;
}

export async function generateCounselorReport(
  entries: JournalEntry[], 
  month: number, 
  year: number
): Promise<CounselorReport> {
  if (!entries || entries.length === 0) {
    return {
      overallMoodTrend: "No entries available for analysis this month.",
      keyInsights: ["No journal entries found for this period"],
      recommendations: ["Start journaling regularly to build insights over time"],
      emotionalPatterns: "Insufficient data to identify patterns",
      monthlyScore: 0,
      summary: "No journal data available for analysis"
    };
  }

  // Prepare journal data for analysis
  const journalData = entries.map(entry => ({
    date: entry.date,
    content: entry.content,
    happinessScore: entry.happinessScore
  }));

  const averageHappiness = entries.reduce((sum, entry) => sum + entry.happinessScore, 0) / entries.length;

  const prompt = `You are a professional mental health counselor analyzing a month of journal entries. 

Journal entries for ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}:

${journalData.map(entry => 
  `Date: ${entry.date}\nHappiness Score: ${entry.happinessScore}/10\nEntry: ${entry.content}\n`
).join('\n---\n')}

Average happiness score: ${averageHappiness.toFixed(1)}/10

Please provide a comprehensive counselor report in JSON format with the following structure:
{
  "overallMoodTrend": "A 2-3 sentence analysis of the person's overall emotional state and mood patterns",
  "keyInsights": ["3-4 specific insights about emotional patterns, triggers, or positive developments"],
  "recommendations": ["3-4 actionable recommendations for emotional wellbeing and personal growth"],
  "emotionalPatterns": "A paragraph describing recurring emotional themes and patterns observed",
  "monthlyScore": [a score from 1-10 representing overall emotional health this month],
  "summary": "A warm, encouraging 2-3 sentence summary highlighting progress and potential"
}

Focus on being supportive, professional, and constructive. Highlight both challenges and growth opportunities. Keep language accessible and encouraging.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an experienced, empathetic mental health counselor providing thoughtful analysis of journal entries. Be supportive, professional, and focus on growth and wellbeing."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      overallMoodTrend: result.overallMoodTrend || "Analysis unavailable",
      keyInsights: result.keyInsights || ["No insights available"],
      recommendations: result.recommendations || ["Continue journaling regularly"],
      emotionalPatterns: result.emotionalPatterns || "No patterns identified",
      monthlyScore: Math.max(1, Math.min(10, result.monthlyScore || Math.round(averageHappiness))),
      summary: result.summary || "Keep up your journaling practice for continued insights"
    };

  } catch (error) {
    console.error("Error generating counselor report:", error);
    
    // Fallback response if AI fails
    return {
      overallMoodTrend: `Based on ${entries.length} entries with an average happiness score of ${averageHappiness.toFixed(1)}/10, your mood this month shows consistency in your journaling practice.`,
      keyInsights: [
        `You made ${entries.length} journal entries this month`,
        `Your average happiness score was ${averageHappiness.toFixed(1)}/10`,
        "Regular journaling supports emotional awareness",
        "Consistent reflection helps identify patterns"
      ],
      recommendations: [
        "Continue your regular journaling practice",
        "Consider exploring themes that emerge in your writing",
        "Notice patterns in your happiness scores",
        "Celebrate your commitment to self-reflection"
      ],
      emotionalPatterns: "Your commitment to regular journaling demonstrates strong self-awareness and dedication to personal growth.",
      monthlyScore: Math.round(averageHappiness),
      summary: "Your consistent journaling practice this month shows dedication to self-reflection and emotional awareness. Keep building on this positive foundation."
    };
  }
}