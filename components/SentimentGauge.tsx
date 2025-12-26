
import React from 'react';

interface SentimentGaugeProps {
  score: number; // -1 to 1
  label: string;
}

const SentimentGauge: React.FC<SentimentGaugeProps> = ({ score, label }) => {
  // Map -1..1 to 0..100 for visual percentage
  const percentage = ((score + 1) / 2) * 100;
  
  const getColor = () => {
    if (score > 0.4) return 'bg-emerald-500';
    if (score > 0.1) return 'bg-green-400';
    if (score < -0.4) return 'bg-rose-600';
    if (score < -0.1) return 'bg-red-400';
    return 'bg-amber-400';
  };

  const getTextColor = () => {
    if (score > 0.1) return 'text-emerald-400';
    if (score < -0.1) return 'text-rose-400';
    return 'text-amber-400';
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
      <h3 className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">Market Sentiment</h3>
      
      <div className="relative w-48 h-24 overflow-hidden">
        {/* Semi-circle track */}
        <div className="absolute top-0 left-0 w-48 h-48 border-[16px] border-slate-700 rounded-full"></div>
        
        {/* Progress track */}
        <div 
          className={`absolute top-0 left-0 w-48 h-48 border-[16px] border-transparent border-t-current ${getTextColor()} rounded-full transition-all duration-1000 ease-out`}
          style={{ 
            transform: `rotate(${(percentage * 1.8) - 90}deg)`,
            borderColor: 'currentColor transparent transparent transparent'
          }}
        ></div>

        <div className="absolute bottom-0 left-0 w-full text-center">
          <span className={`text-3xl font-bold ${getTextColor()}`}>{label}</span>
        </div>
      </div>
      
      <div className="mt-4 flex flex-col items-center">
        <div className="text-slate-500 text-xs mb-1">Sentiment Score</div>
        <div className="text-xl font-mono font-bold tracking-tighter">
          {score > 0 ? '+' : ''}{score.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default SentimentGauge;
