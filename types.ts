
export interface SentimentAnalysis {
  ticker: string;
  name: string;
  score: number; // -1 to 1
  label: 'Bullish' | 'Bearish' | 'Neutral' | 'Strongly Bullish' | 'Strongly Bearish';
  summary: string;
  keyDrivers: string[];
  riskFactors: string[];
  recommendation: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  lastUpdated?: string;
  exchange?: 'NSE' | 'BSE' | 'BOTH';
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChartData {
  time: string;
  price: number;
  volume: number;
}

export interface MarketStatus {
  isOpen: boolean;
  status: 'OPEN' | 'CLOSED' | 'PRE-MARKET' | 'POST-MARKET';
  nextEvent: string;
}
