import OpenAI from "openai";
import type { JournalEntry } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface CounselorReport {
  recommendations: string[];
  monthlyScore: number;
  detailedAnalysis: string;
}

export async function generateCounselorReport(
  entries: JournalEntry[], 
  month: number, 
  year: number
): Promise<CounselorReport> {
  if (!entries || entries.length === 0) {
    return {
      recommendations: ["Start journaling regularly to build insights over time", "Set a daily reminder to write in your journal"],
      monthlyScore: 0,
      detailedAnalysis: "No journal data available for analysis this month. Begin by writing regular entries to start tracking your emotional journey and building insights over time."
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
  "recommendations": ["2-4 actionable recommendations focused on positive self-improvement and emotional wellbeing"],
  "monthlyScore": [a score from 1-10 representing overall emotional health this month],
  "detailedAnalysis": "A detailed 200-500 word analysis of the entries, providing insights, feedback, emotional patterns, mood trends, and constructive observations about the person's emotional journey this month"
}

Focus on being supportive, professional, and constructive. The detailed analysis should be comprehensive yet accessible, highlighting both challenges and growth opportunities. Keep language encouraging and insightful.`;

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
      recommendations: result.recommendations || ["Continue journaling regularly", "Focus on consistency in your practice"],
      monthlyScore: Math.max(1, Math.min(10, result.monthlyScore || Math.round(averageHappiness))),
      detailedAnalysis: result.detailedAnalysis || "Analysis unavailable for this period. Continue journaling to build insights over time."
    };

  } catch (error) {
    console.error("Error generating counselor report:", error);
    
    // Fallback response if AI fails
    return {
      recommendations: [
        "Continue your regular journaling practice",
        "Consider exploring themes that emerge in your writing",
        "Notice patterns in your happiness scores",
        "Celebrate your commitment to self-reflection"
      ],
      monthlyScore: Math.round(averageHappiness),
      detailedAnalysis: `Based on ${entries.length} journal entries with an average happiness score of ${averageHappiness.toFixed(1)}/10, your journaling practice this month demonstrates consistency and self-awareness. Your commitment to regular reflection shows dedication to personal growth and emotional understanding. This consistent practice provides a foundation for deeper insights and continued emotional development. Keep building on this positive foundation as you continue your journaling journey.`
    };
  }
}