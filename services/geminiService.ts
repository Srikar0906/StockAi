
import { GoogleGenAI, Type } from "@google/genai";
import { SentimentAnalysis, GroundingSource } from "../types";

export async function analyzeSentiment(ticker: string): Promise<{ analysis: SentimentAnalysis, sources: GroundingSource[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  
  const prompt = `Perform a deep market sentiment analysis for the Indian stock ticker: ${ticker}. 
  Focus specifically on data from the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE).
  
  Use Google Search to find:
  1. The VERY LATEST live or last closing price on BOTH NSE and BSE in INR.
  2. The actual price change and percentage change for today's session.
  3. Recent news from Indian financial portals.
  4. Estimate a sentiment distribution (percentages for Negative, Neutral, Positive) based on current news volume and tone.
  
  IMPORTANT: 
  - All financial values MUST be in Indian Rupees (INR/₹).
  - Provide separate nsePrice and bsePrice.
  
  Return the final analysis in JSON format.`;

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
          nsePrice: { type: Type.NUMBER },
          bsePrice: { type: Type.NUMBER },
          priceChange: { type: Type.NUMBER },
          priceChangePercent: { type: Type.NUMBER },
          sentimentDistribution: {
            type: Type.OBJECT,
            properties: {
              negative: { type: Type.NUMBER },
              neutral: { type: Type.NUMBER },
              positive: { type: Type.NUMBER }
            },
            required: ["negative", "neutral", "positive"]
          }
        },
        required: ["ticker", "name", "score", "label", "summary", "keyDrivers", "riskFactors", "recommendation", "nsePrice", "bsePrice", "sentimentDistribution"]
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
