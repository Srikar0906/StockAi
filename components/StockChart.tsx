
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartData } from '../types';

interface StockChartProps {
  data: ChartData[];
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({ data, ticker }) => {
  const isPositive = data.length > 1 && data[data.length - 1].price >= data[0].price;
  const color = isPositive ? '#10b981' : '#f43f5e';

  return (
    <div className="h-full w-full p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 shadow-inner">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{ticker} Intraday Performance (₹)</h3>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart 
          data={data} 
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
          />
          <YAxis 
            domain={['auto', 'auto']} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
            tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
            width={70}
          />
          <Tooltip 
            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Price']}
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
            strokeWidth={3}
            animationDuration={1500}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
