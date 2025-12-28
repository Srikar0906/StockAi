
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, Info, ExternalLink, AlertCircle, RefreshCw, BarChart3, Globe, Clock, ArrowUpRight, ArrowDownRight, Newspaper, History, X, ChevronRight } from 'lucide-react';
import { analyzeSentiment } from './services/geminiService';
import { SentimentAnalysis, GroundingSource, ChartData, MarketStatus } from './types';
import StockChart from './components/StockChart';
import AnimatedNumber from './components/AnimatedNumber';

const POPULAR_TICKERS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'ADANIENT'];

const SUGGESTED_TICKERS = [
  "NIFTY 50", "SENSEX", "BANKNIFTY", "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", 
  "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK", "L&T", "AXISBANK", "HINDUNILVR", "BAJFINANCE", 
  "MARUTI", "ASIANPAINT", "TITAN", "TATAMOTORS", "SUNPHARMA", "ULTRACEMCO", "NTPC", "M&M", 
  "HCLTECH", "ONGC", "POWERGRID", "ADANIENT", "ADANIPORTS", "WIPRO", "COALINDIA", "BAJAJFINSV",
  "JSWSTEEL", "TATASTEEL", "GRASIM", "TECHM", "INDUSINDBK", "HDFCLIFE", "NESTLEIND", "CIPLA",
  "ZOMATO", "PAYTM", "LICI", "JIOFIN", "DMART"
];

const getIndianMarketStatus = (): MarketStatus => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const day = istDate.getUTCDay();
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const currentTime = hours * 60 + minutes;

  const isWeekend = day === 0 || day === 6;
  const openTime = 9 * 60 + 15;
  const closeTime = 15 * 60 + 30;

  if (isWeekend) return { isOpen: false, status: 'CLOSED', nextEvent: 'Opens Monday 9:15 AM' };
  if (currentTime < 9 * 60) return { isOpen: false, status: 'CLOSED', nextEvent: 'Pre-market starts at 9:00 AM' };
  if (currentTime < openTime) return { isOpen: false, status: 'PRE-MARKET', nextEvent: 'Market opens at 9:15 AM' };
  if (currentTime < closeTime) return { isOpen: true, status: 'OPEN', nextEvent: 'Market closes at 3:30 PM' };
  return { isOpen: false, status: 'CLOSED', nextEvent: 'Opens tomorrow at 9:15 AM' };
};

const App: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [marketStatus, setMarketStatus] = useState<MarketStatus>(getIndianMarketStatus());
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load recent searches from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem('stocksense_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }
  }, []);

  const addToRecent = useCallback((newTicker: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t !== newTicker);
      const updated = [newTicker, ...filtered].slice(0, 6);
      localStorage.setItem('stocksense_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('stocksense_recent_searches');
  };

  const generateMockChart = (basePrice: number) => {
    const data: ChartData[] = [];
    let currentPrice = basePrice * 0.99;
    const startTime = 9 * 60 + 15;
    const endTime = 15 * 60 + 30;
    for (let t = startTime; t <= endTime; t += 15) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      currentPrice += (Math.random() - 0.45) * (basePrice * 0.005);
      data.push({
        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        price: Number(currentPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 500000)
      });
    }
    data[data.length - 1].price = basePrice;
    setChartData(data);
  };

  const handleSearch = useCallback(async (searchTicker: string = ticker) => {
    const query = searchTicker.trim().toUpperCase();
    if (!query) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    
    // Normalize index names for better grounding
    const normalizedQuery = query === 'NIFTY 50' ? 'NIFTY' : query;

    try {
      const { analysis, sources } = await analyzeSentiment(normalizedQuery);
      setAnalysis(analysis);
      setSources(sources);
      generateMockChart(analysis.nsePrice || 1000);
      addToRecent(query);
      setTicker(query);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError('Market Intelligence sync failed. Please check ticker and try again.');
    } finally {
      setLoading(false);
    }
  }, [ticker, addToRecent]);

  const getSuggestions = (input: string) => {
    if (!input) return [];
    const upperInput = input.toUpperCase();
    const allOptions = Array.from(new Set([...recentSearches, ...SUGGESTED_TICKERS]));
    return allOptions
        .filter(opt => opt.includes(upperInput) && opt !== upperInput)
        .slice(0, 6);
  };

  const currentSuggestions = getSuggestions(ticker);

  useEffect(() => {
    const interval = setInterval(() => setMarketStatus(getIndianMarketStatus()), 60000);
    return () => clearInterval(interval);
  }, []);

  const goHome = () => {
    setAnalysis(null);
    setTicker('');
    setSources([]);
    setChartData([]);
    setShowSuggestions(false);
  };

  const RecentSearchesBar = () => {
    if (recentSearches.length === 0) return null;
    return (
      <div className="flex items-center gap-4 py-2 border-b border-slate-900/50 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-slate-500 shrink-0">
          <History className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Recent</span>
        </div>
        <div className="flex gap-2">
          {recentSearches.map(t => (
            <button
              key={t}
              onClick={() => handleSearch(t)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${ticker === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'}`}
            >
              {t}
            </button>
          ))}
          <button 
            onClick={clearRecent}
            className="p-1 text-slate-600 hover:text-rose-500 transition-colors"
            title="Clear History"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const HomeView = () => (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="text-center py-12">
        <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-white via-indigo-400 to-slate-500 bg-clip-text text-transparent tracking-tighter">
          India's Smartest Sentiment Engine
        </h2>
        <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
          Deep-dive into NSE & BSE stocks with real-time AI grounding. Analyzed headlines, social pulse, and institutional shifts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => handleSearch('NIFTY 50')}
          className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl group hover:border-indigo-500/50 hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">NIFTY 50</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <AnimatedNumber value={24367.90} className="text-3xl font-black mb-1 block" />
          <div className="text-emerald-400 text-xs font-bold">+1.24% (+298.50)</div>
          <div className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">Click for Analysis</div>
        </div>

        <div 
          onClick={() => handleSearch('SENSEX')}
          className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl group hover:border-indigo-500/50 hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">SENSEX</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <AnimatedNumber value={80109.85} className="text-3xl font-black mb-1 block" />
          <div className="text-emerald-400 text-xs font-bold">+1.18% (+932.12)</div>
          <div className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">Click for Analysis</div>
        </div>

        <div 
          onClick={() => handleSearch('HDFCBANK')}
          className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl group hover:border-rose-500/30 hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-rose-500/10"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">TOP LOSER</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black mb-1">HDFCBANK</div>
          <div className="text-rose-400 text-xs font-bold">-0.85% (₹1,654.20)</div>
          <div className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">Click for Analysis</div>
        </div>

        <div 
          onClick={() => handleSearch('ADANIENT')}
          className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl group hover:border-emerald-500/30 hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">TOP GAINER</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black mb-1">ADANIENT</div>
          <div className="text-emerald-400 text-xs font-bold">+4.32% (₹3,120.45)</div>
          <div className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">Click for Analysis</div>
        </div>
      </div>

      <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[3rem] text-center">
        <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Quick Ticker Access</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {POPULAR_TICKERS.map(t => (
            <button 
              key={t} 
              onClick={() => handleSearch(t)} 
              className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:border-indigo-500 hover:scale-105 active:scale-95 transition-all"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const SentimentBar = ({ label, percentage, colorClass }: { label: string, percentage: number, colorClass: string }) => (
    <div className="flex items-center gap-4 w-full">
      <span className="w-20 text-xs font-bold text-slate-400 uppercase">{label}</span>
      <div className="flex-1 h-6 bg-slate-800 rounded-lg overflow-hidden border border-slate-700/50 shadow-inner">
        <div className={`h-full ${colorClass} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="w-10 text-[10px] font-black text-slate-500 text-right">
        <AnimatedNumber value={percentage} precision={0} duration={1000} isInteger />%
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={goHome}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
              STOCK SENSE
            </h1>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex-1 max-w-md mx-8 hidden sm:block relative">
            <div className="relative group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
              <input
                type="text"
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search NSE/BSE..."
                className="w-full bg-slate-900 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 font-medium"
                autoComplete="off"
              />
              
              {/* Suggestion Dropdown */}
              {showSuggestions && currentSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {currentSuggestions.map((s) => (
                    <div
                      key={s}
                      className="px-4 py-3 hover:bg-indigo-600/20 cursor-pointer text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between transition-colors border-b border-slate-800/50 last:border-0"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setTicker(s);
                        handleSearch(s);
                        setShowSuggestions(false);
                      }}
                    >
                      <span className="tracking-wide">{s}</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${marketStatus.isOpen ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${marketStatus.isOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
              {marketStatus.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <RecentSearchesBar />
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="mt-8 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Dalal Street Intel...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-10 text-center max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Sync Failed</h2>
            <p className="text-slate-400 mb-6 text-sm">{error}</p>
            <button onClick={() => handleSearch()} className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : analysis ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-8 md:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                  <div className="space-y-2">
                    <h2 className="text-5xl font-black tracking-tighter uppercase">{analysis.ticker}</h2>
                    <p className="text-slate-400 text-xl font-semibold opacity-80">{analysis.name}</p>
                  </div>
                  <div className="text-right space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase">NSE:</span>
                        <AnimatedNumber 
                          value={analysis.nsePrice || 0} 
                          prefix="₹" 
                          className="text-3xl font-black" 
                          duration={2500}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase">BSE:</span>
                        <AnimatedNumber 
                          value={analysis.bsePrice || 0} 
                          prefix="₹" 
                          className="text-3xl font-black" 
                          duration={2500}
                        />
                      </div>
                    </div>
                    <div className={`flex items-center justify-end gap-2 font-black text-xl ${analysis.priceChange && analysis.priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {analysis.priceChange && analysis.priceChange >= 0 ? '▲' : '▼'}
                      <AnimatedNumber 
                        value={Math.abs(analysis.priceChange || 0)} 
                        className="" 
                        duration={2000}
                      />
                      {' '}(
                      <AnimatedNumber 
                        value={analysis.priceChangePercent || 0} 
                        className="" 
                        duration={2000}
                      />
                      %)
                    </div>
                  </div>
                </div>

                <div className="space-y-10 mb-12">
                  <div className="bg-slate-950/50 p-8 rounded-[2.5rem] border border-slate-800/50 space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sentiment Analysis</h4>
                    <div className="space-y-5">
                      <SentimentBar label="Negative" percentage={analysis.sentimentDistribution.negative} colorClass="bg-rose-500" />
                      <SentimentBar label="Neutral" percentage={analysis.sentimentDistribution.neutral} colorClass="bg-slate-600" />
                      <SentimentBar label="Positive" percentage={analysis.sentimentDistribution.positive} colorClass="bg-teal-500" />
                    </div>
                  </div>

                  <div className="h-[350px] w-full">
                    <StockChart data={chartData} ticker={analysis.ticker} />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 p-6 bg-slate-950/40 border border-slate-800 rounded-3xl">
                    <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Positive Catalysts</h5>
                    <ul className="space-y-3">
                      {analysis.keyDrivers.map((d, i) => (
                        <li key={i} className="text-xs text-slate-300 flex gap-3 leading-snug font-medium">
                          <span className="text-emerald-500 font-black">•</span> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 p-6 bg-slate-950/40 border border-slate-800 rounded-3xl">
                    <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Risk Factors</h5>
                    <ul className="space-y-3">
                      {analysis.riskFactors.map((r, i) => (
                        <li key={i} className="text-xs text-slate-300 flex gap-3 leading-snug font-medium">
                          <span className="text-rose-500 font-black">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col h-full">
                <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                   <Newspaper className="w-5 h-5 text-indigo-400" /> Latest Headlines
                </h3>
                <div className="space-y-4 flex-1">
                  {sources.length > 0 ? sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" className="block p-5 bg-slate-950/40 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all group">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 leading-snug uppercase tracking-tight">{s.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-700 shrink-0 group-hover:text-indigo-400" />
                      </div>
                    </a>
                  )) : (
                    <div className="text-center py-20 text-slate-600 text-xs font-bold uppercase italic">No news sources found...</div>
                  )}
                </div>
                <div className="mt-8 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">AI Verdict</h4>
                  <div className="text-2xl font-black mb-2 uppercase tracking-tighter">{analysis.recommendation}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic font-medium">"{analysis.summary}"</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <HomeView />
        )}
      </main>

      <footer className="border-t border-slate-900 py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <p className="text-slate-800 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Intelligence Engine • Stock Sense</p>
          <div className="flex gap-10 opacity-40 grayscale hover:grayscale-0 transition-all">
            {['NSE', 'BSE', 'GIFT NIFTY', 'SEBI'].map(b => (
              <span key={b} className="text-[9px] font-black text-slate-700">{b}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
