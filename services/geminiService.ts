
import { GoogleGenAI, Type } from "@google/genai";
import { SentimentAnalysis, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function analyzeSentiment(ticker: string): Promise<{ analysis: SentimentAnalysis, sources: GroundingSource[] }> {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Perform a deep market sentiment analysis for the Indian stock ticker: ${ticker}. 
  Focus specifically on data from the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE).
  
  Use Google Search to find:
  1. The VERY LATEST live or last closing price on NSE/BSE in INR.
  2. The actual price change and percentage change for today's session.
  3. Recent news from Indian financial portals (Moneycontrol, Economic Times, Livemint).
  4. Institutional activity and key catalysts.
  
  IMPORTANT: 
  - All financial values MUST be in Indian Rupees (INR/₹).
  - Provide the actual current price found via search.
  
  You must provide:
  1. A sentiment score between -1 and 1.
  2. A summary of current market mood.
  3. 3-4 key drivers and 2-3 risk factors.
  4. A concise recommendation.
  5. The REAL current price, price change, and percentage change.
  6. The full company name as listed on NSE.

  Return the final analysis in a structured format.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ticker: { type: Type.STRING },
          name: { type: Type.STRING },
          score: { type: Type.NUMBER },
          label: { type: Type.STRING },
          summary: { type: Type.STRING },
          keyDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendation: { type: Type.STRING },
          currentPrice: { type: Type.NUMBER },
          priceChange: { type: Type.NUMBER },
          priceChangePercent: { type: Type.NUMBER },
          exchange: { type: Type.STRING },
        },
        required: ["ticker", "name", "score", "label", "summary", "keyDrivers", "riskFactors", "recommendation", "currentPrice", "priceChange", "priceChangePercent"]
      }
    }
  });

  const analysis = JSON.parse(response.text) as SentimentAnalysis;
  analysis.lastUpdated = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  const sources: GroundingSource[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title,
          uri: chunk.web.uri
        });
      }
    });
  }

  return { analysis, sources };
}
