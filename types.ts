
export interface SentimentAnalysis {
  ticker: string;
  name: string;
  score: number; // -1 to 1
  label: string;
  summary: string;
  keyDrivers: string[];
  riskFactors: string[];
  recommendation: string;
  currentPrice?: number;
  nsePrice?: number;
  bsePrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  lastUpdated?: string;
  sentimentDistribution: {
    negative: number;
    neutral: number;
    positive: number;
  };
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
