import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const PerformanceChart: React.FC = () => {
  const { goats, expenses, healthRecords } = useApp();
  
  // Generate real data from the last 12 months
  const data = React.useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Calculate investment for this month (goats purchased)
      const monthlyInvestment = goats
        .filter(goat => goat.purchaseDate >= monthStart && goat.purchaseDate <= monthEnd)
        .reduce((sum, goat) => sum + goat.purchasePrice, 0);
      
      // Calculate revenue for this month (goats sold)
      const monthlyRevenue = goats
        .filter(goat => goat.saleDate && goat.saleDate >= monthStart && goat.saleDate <= monthEnd)
        .reduce((sum, goat) => sum + (goat.salePrice || 0), 0);
      
      // Calculate expenses for this month
      const monthlyExpenses = expenses
        .filter(expense => expense.date >= monthStart && expense.date <= monthEnd)
        .reduce((sum, expense) => sum + expense.amount, 0) +
        healthRecords
        .filter(record => record.date >= monthStart && record.date <= monthEnd)
        .reduce((sum, record) => sum + record.cost, 0);
      
      // Calculate cumulative values
      const cumulativeInvestment = goats
        .filter(goat => goat.purchaseDate <= monthEnd)
        .reduce((sum, goat) => sum + goat.purchasePrice, 0);
      
      const cumulativeRevenue = goats
        .filter(goat => goat.saleDate && goat.saleDate <= monthEnd)
        .reduce((sum, goat) => sum + (goat.salePrice || 0), 0);
      
      const cumulativeExpenses = expenses
        .filter(expense => expense.date <= monthEnd)
        .reduce((sum, expense) => sum + expense.amount, 0) +
        healthRecords
        .filter(record => record.date <= monthEnd)
        .reduce((sum, record) => sum + record.cost, 0);
      
      const profit = cumulativeRevenue - cumulativeInvestment - cumulativeExpenses;
      
      months.push({
        month: format(monthDate, 'MMM'),
        investment: cumulativeInvestment,
        revenue: cumulativeRevenue,
        profit: profit,
        monthlyInvestment,
        monthlyRevenue,
        monthlyExpenses
      });
    }
    
    return months.filter(month => month.investment > 0 || month.revenue > 0 || month.monthlyExpenses > 0);
  }, [goats, expenses, healthRecords]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Performance</h3>
      {data.some(d => d.investment > 0 || d.revenue > 0) ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `₹${Math.abs(value) / 1000}k`}
              />
              <Tooltip 
                formatter={(value, name) => [`₹${value.toLocaleString()}`, name]}
                labelStyle={{ color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="investment" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Cumulative Investment"
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Cumulative Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Net Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-lg font-medium">No Financial Data</p>
            <p className="text-sm">Chart will appear when you add goats and transactions</p>
          </div>
        </div>
      )}
    </div>
  );
};