
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, ReferenceLine, ReferenceArea, Legend } from 'recharts';
import { ChartData } from '../types';

interface StockChartProps {
  data: ChartData[];
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({ data, ticker }) => {
  const [indicators, setIndicators] = useState({
    sma9: false,
    sma21: false,
    rsi: false
  });

  const isPositive = data.length > 1 && data[data.length - 1].price >= data[0].price;
  const color = isPositive ? '#10b981' : '#f43f5e';

  // Calculate indicators
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // SMA Calculation
    const calculateSMA = (period: number) => {
      return data.map((item, index, arr) => {
        if (index < period - 1) return { ...item };
        const slice = arr.slice(index - period + 1, index + 1);
        const sum = slice.reduce((acc, curr) => acc + curr.price, 0);
        return sum / period;
      });
    };

    const sma9 = calculateSMA(9);
    const sma21 = calculateSMA(21);

    // RSI Calculation
    const rsiPeriod = 14;
    const rsiData: (number | null)[] = new Array(data.length).fill(null);
    let gains = 0;
    let losses = 0;

    // Initial average gain/loss
    if (data.length > rsiPeriod) {
      for (let i = 1; i <= rsiPeriod; i++) {
        const change = data[i].price - data[i - 1].price;
        if (change > 0) gains += change;
        else losses -= change;
      }
      let avgGain = gains / rsiPeriod;
      let avgLoss = losses / rsiPeriod;
      
      rsiData[rsiPeriod] = 100 - (100 / (1 + (avgGain / (avgLoss === 0 ? 1 : avgLoss))));

      // Smooth RSI
      for (let i = rsiPeriod + 1; i < data.length; i++) {
        const change = data[i].price - data[i - 1].price;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
        avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;
        
        rsiData[i] = 100 - (100 / (1 + (avgGain / (avgLoss === 0 ? 1 : avgLoss))));
      }
    }

    return data.map((item, i) => ({
      ...item,
      sma9: sma9[i],
      sma21: sma21[i],
      rsi: rsiData[i]
    }));
  }, [data]);

  const toggleIndicator = (key: keyof typeof indicators) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-full w-full p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 shadow-inner flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{ticker} Performance</h3>
        
        <div className="flex gap-2">
           <button 
            onClick={() => toggleIndicator('sma9')}
            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${indicators.sma9 ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
          >
            SMA 9
          </button>
          <button 
            onClick={() => toggleIndicator('sma21')}
            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${indicators.sma21 ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
          >
            SMA 21
          </button>
          <button 
            onClick={() => toggleIndicator('rsi')}
            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${indicators.rsi ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
          >
            RSI 14
          </button>
        </div>
      </div>

      <div className={`w-full ${indicators.rsi ? 'h-[65%]' : 'h-[90%]'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={processedData} 
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
              minTickGap={30}
              hide={indicators.rsi} // hide X axis on main chart if RSI is visible
            />
            <YAxis 
              domain={['auto', 'auto']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
              tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
              width={60}
            />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name === "sma9") return [`₹${Number(value).toFixed(2)}`, 'SMA (9)'];
                if (name === "sma21") return [`₹${Number(value).toFixed(2)}`, 'SMA (21)'];
                return [`₹${value.toLocaleString('en-IN')}`, 'Price'];
              }}
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #334155', 
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                padding: '10px'
              }}
              labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px', fontWeight: 800 }}
              itemStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: 700 }}
            />
            
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={color} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              strokeWidth={2}
            />

            {indicators.sma9 && (
              <Line 
                type="monotone" 
                dataKey="sma9" 
                stroke="#fb923c" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            )}
            
            {indicators.sma21 && (
              <Line 
                type="monotone" 
                dataKey="sma21" 
                stroke="#818cf8" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {indicators.rsi && (
        <div className="h-[30%] w-full mt-2 relative">
           <div className="absolute top-0 left-2 text-[8px] font-black text-purple-400 z-10 bg-slate-900/50 px-1 rounded backdrop-blur-sm">RSI (14)</div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={processedData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                minTickGap={30}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                width={60}
                ticks={[30, 70]}
              />
              {/* Highlight Overbought Zone */}
              <ReferenceArea y1={70} y2={100} fill="#ef4444" fillOpacity={0.05} />
              {/* Highlight Oversold Zone */}
              <ReferenceArea y1={0} y2={30} fill="#10b981" fillOpacity={0.05} />
              
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
              
              <Tooltip 
                cursor={{ stroke: '#475569', strokeWidth: 1 }}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #334155', 
                  borderRadius: '12px',
                  padding: '5px'
                }}
                labelStyle={{ display: 'none' }}
                itemStyle={{ color: '#c084fc', fontSize: '11px', fontWeight: 700 }}
                formatter={(val: number) => [val.toFixed(2), 'RSI']}
              />
              <Line 
                type="monotone" 
                dataKey="rsi" 
                stroke="#c084fc" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default StockChart;
