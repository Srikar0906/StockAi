
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
    <div className="h-[300px] w-full p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">{ticker} Price Action (Simulated ₹)</h3>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10 }}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
          />
          <Tooltip 
            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Price']}
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
