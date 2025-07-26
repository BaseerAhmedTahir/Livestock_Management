import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Calendar, Users, Target } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './FinanceManagement.css';
import { TransactionForm } from '../Forms/TransactionForm';
import { useApp } from '../../context/AppContext';

export const FinanceManagement: React.FC = () => {
  const { goats, expenses, caretakers, healthRecords } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Simulate loading state for smoother transitions
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate comprehensive financial metrics
  const calculateFinancialMetrics = () => {
    const totalInvestment = goats.reduce((sum, goat) => sum + goat.purchasePrice, 0);
    const totalRevenue = goats
      .filter(g => g.salePrice)
      .reduce((sum, goat) => sum + (goat.salePrice || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const healthExpenses = healthRecords.reduce((sum, record) => sum + record.cost, 0);
    const totalCosts = totalInvestment + totalExpenses + healthExpenses;
    const netProfit = totalRevenue - totalCosts;
    
    return {
      totalInvestment,
      totalRevenue,
      totalExpenses: totalExpenses + healthExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      roi: totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0
    };
  };

  const metrics = calculateFinancialMetrics();

  const soldGoats = goats.filter(g => g.status === 'Sold');
  
  // Calculate profit per goat including all expenses
  const calculateGoatProfit = (goat: any) => {
    if (!goat.salePrice) return 0;
    
    // Calculate specific expenses for this goat
    const specificExpenses = expenses.filter(e => e.goatId === goat.id).reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate shared expenses (expenses without specific goat assignment)
    const generalExpenses = expenses.filter(e => !e.goatId).reduce((sum, e) => sum + e.amount, 0);
    const activeGoats = goats.filter(g => g.status === 'Active');
    const totalActiveGoats = activeGoats.length;
    const sharedExpensePerGoat = totalActiveGoats > 0 ? generalExpenses / totalActiveGoats : 0;
    
    // Calculate health expenses for this goat
    const healthExpenses = healthRecords.filter(h => h.goatId === goat.id).reduce((sum, h) => sum + h.cost, 0);
    
    const totalExpenses = specificExpenses + sharedExpensePerGoat + healthExpenses;
    return goat.salePrice - goat.purchasePrice - totalExpenses;
  };

  const averageProfit = soldGoats.length > 0 
    ? soldGoats.reduce((sum, goat) => sum + calculateGoatProfit(goat), 0) / soldGoats.length
    : 0;

  // Calculate caretaker earnings
  const calculateCaretakerEarnings = () => {
    return caretakers.map(caretaker => {
      const caretakerGoats = soldGoats.filter(g => g.caretakerId === caretaker.id);
      let totalEarnings = 0;
      
      caretakerGoats.forEach(goat => {
        const profit = calculateGoatProfit(goat);
        if (caretaker.paymentModel.type === 'percentage') {
          totalEarnings += (profit * caretaker.paymentModel.amount) / 100;
        } else {
          totalEarnings += caretaker.paymentModel.amount;
        }
      });
      
      return {
        ...caretaker,
        earnings: totalEarnings,
        goatsManaged: caretakerGoats.length
      };
    });
  };

  const caretakerEarnings = calculateCaretakerEarnings();

  const expenseByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseData = Object.entries(expenseByCategory).map(([category, amount]) => ({
    category,
    amount,
    color: {
      'Feed': '#10b981',
      'Medicine': '#f59e0b',
      'Transport': '#3b82f6',
      'Veterinary': '#ef4444',
      'Other': '#8b5cf6'
    }[category] || '#6b7280'
  }));

  // Generate real monthly data from actual transactions
  const monthlyData = React.useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthlyRevenue = goats
        .filter(goat => goat.saleDate && goat.saleDate >= monthStart && goat.saleDate <= monthEnd)
        .reduce((sum, goat) => sum + (goat.salePrice || 0), 0);
      
      const monthlyExpenses = expenses
        .filter(expense => expense.date >= monthStart && expense.date <= monthEnd)
        .reduce((sum, expense) => sum + expense.amount, 0) +
        healthRecords
        .filter(record => record.date >= monthStart && record.date <= monthEnd)
        .reduce((sum, record) => sum + record.cost, 0);
      
      const monthlyProfit = monthlyRevenue - monthlyExpenses;
      
      months.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        profit: monthlyProfit
      });
    }
    
    return months.filter(month => month.revenue > 0 || month.expenses > 0);
  }, [goats, expenses, healthRecords]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'profit-analysis', name: 'Profit Analysis' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'expenses', name: 'Expenses' },
    { id: 'caretaker-earnings', name: 'Caretaker Earnings' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="space-y-8 w-full max-w-5xl px-4">
          {/* Header skeleton */}
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-48 bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Chart skeleton */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded"></div>
              <div className="h-64 w-full bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Financial Management
          </h2>
          <p className="text-gray-600 mt-1">Track investments, expenses, and profitability</p>
        </div>
        <button 
          onClick={() => setIsTransactionFormOpen(true)}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 
            transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 
            focus:ring-emerald-500 focus:ring-offset-2 shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Total Investment</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(metrics.totalInvestment)}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600 tracking-tight">
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 tracking-tight">
                {formatCurrency(metrics.totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold tracking-tight ${
                metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {formatCurrency(metrics.netProfit)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              metrics.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'
            }`}>
              {metrics.netProfit >= 0 ? (
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto pb-px">
        <nav className="flex space-x-8 min-w-full sm:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 
                transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transform transition-all duration-200 hover:shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Financial Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280" 
                    fontSize={12} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={12} 
                    tickFormatter={(value) => `₹${value / 1000}k`} 
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value, name) => [`₹${value.toLocaleString()}`, name]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#10b981" 
                    name="Revenue" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="expenses" 
                    fill="#ef4444" 
                    name="Expenses" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transform transition-all duration-200 hover:shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    dataKey="amount"
                    label={({ category, percent }) => 
                      percent ? `${category} (${(percent * 100).toFixed(0)}%)` : ''
                    }
                    labelLine={false}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 transition-all duration-200 hover:shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <p className="text-sm text-gray-600 mt-1">Track your sales and revenue</p>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Calendar className="h-5 w-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Users className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {soldGoats.map((goat) => (
              <div key={goat.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">Sale: {goat.tagNumber} - {goat.nickname}</h4>
                    <p className="text-sm text-gray-600">{goat.breed} • {goat.gender}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{goat.saleDate && format(goat.saleDate, 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-emerald-600">
                      +{formatCurrency(goat.salePrice || 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Net Profit: {formatCurrency(calculateGoatProfit(goat))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 transition-all duration-200 hover:shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Expense Records</h3>
                <p className="text-sm text-gray-600 mt-1">Track and manage your expenses</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="all">All Categories</option>
                    <option value="feed">Feed</option>
                    <option value="medicine">Medicine</option>
                    <option value="transport">Transport</option>
                    <option value="veterinary">Veterinary</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M7 7l3 3 3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {expenses.map((expense) => {
              const goat = expense.goatId ? goats.find(g => g.id === expense.goatId) : null;
              const caretaker = expense.caretakerId ? caretakers.find(c => c.id === expense.caretakerId) : null;
              
              const categoryColors = {
                Feed: 'bg-green-100 text-green-800',
                Medicine: 'bg-blue-100 text-blue-800',
                Transport: 'bg-yellow-100 text-yellow-800',
                Veterinary: 'bg-purple-100 text-purple-800',
                Other: 'bg-gray-100 text-gray-800'
              };
              
              return (
                <div key={expense.id} className="p-6 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[expense.category]}`}>
                          {expense.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{expense.description}</h4>
                      <div className="space-y-1">
                        {goat && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="w-20 text-gray-500">Goat:</span>
                            <span className="font-medium">{goat.tagNumber} - {goat.nickname || 'Unnamed'}</span>
                          </p>
                        )}
                        {caretaker && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="w-20 text-gray-500">Caretaker:</span>
                            <span className="font-medium">{caretaker.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right sm:min-w-[120px]">
                      <p className="text-lg font-semibold text-red-600">
                        -{formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Added {format(new Date(expense.date), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'profit-analysis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-medium text-gray-600 mb-2">Average Profit per Goat</h4>
              <p className={`text-2xl font-bold ${averageProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(averageProfit)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-medium text-gray-600 mb-2">Profit Margin</h4>
              <p className={`text-2xl font-bold ${metrics.profitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {metrics.profitMargin.toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-medium text-gray-600 mb-2">ROI</h4>
              <p className={`text-2xl font-bold ${metrics.roi >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {metrics.roi.toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-medium text-gray-600 mb-2">Goats Sold</h4>
              <p className="text-2xl font-bold text-gray-900">{soldGoats.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Profit Analysis by Goat</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {soldGoats.map((goat) => {
                const profit = calculateGoatProfit(goat);
                const profitPercentage = goat.purchasePrice > 0 ? (profit / goat.purchasePrice) * 100 : 0;
                const caretaker = goat.caretakerId ? caretakers.find(c => c.id === goat.caretakerId) : null;
                
                // Calculate specific expenses for this goat
                const specificExpenses = expenses.filter(e => e.goatId === goat.id).reduce((sum, e) => sum + e.amount, 0);
                
                // Calculate shared expenses
                const generalExpenses = expenses.filter(e => !e.goatId).reduce((sum, e) => sum + e.amount, 0);
                const activeGoats = goats.filter(g => g.status === 'Active');
                const totalActiveGoats = activeGoats.length;
                const sharedExpensePerGoat = totalActiveGoats > 0 ? generalExpenses / totalActiveGoats : 0;
                
                // Calculate health expenses
                const healthExpenses = healthRecords.filter(h => h.goatId === goat.id).reduce((sum, h) => sum + h.cost, 0);
                
                let ownerShare = profit;
                let caretakerShare = 0;
                
                if (caretaker && caretaker.paymentModel.type === 'percentage') {
                  caretakerShare = (profit * caretaker.paymentModel.amount) / 100;
                  ownerShare = profit - caretakerShare;
                }
                
                return (
                  <div key={goat.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={goat.photos[0] || 'https://images.pexels.com/photos/2647053/pexels-photo-2647053.jpeg'}
                          alt={goat.tagNumber}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{goat.tagNumber} - {goat.nickname || 'Unnamed'}</h4>
                          <p className="text-sm text-gray-600">{goat.breed} • {goat.gender}</p>
                          <p className="text-xs text-gray-500">Sold on {goat.saleDate && format(goat.saleDate, 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(profit)}
                        </p>
                        <p className={`text-sm ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {profitPercentage.toFixed(1)}% ROI
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Sale Price:</span>
                        <p className="font-semibold text-emerald-600">{formatCurrency(goat.salePrice || 0)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Purchase Price:</span>
                        <p className="font-semibold text-gray-900">{formatCurrency(goat.purchasePrice)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Care Expenses:</span>
                        <p className="font-semibold text-red-600">{formatCurrency(specificExpenses + sharedExpensePerGoat)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Health Costs:</span>
                        <p className="font-semibold text-red-600">{formatCurrency(healthExpenses)}</p>
                      </div>
                    </div>
                    
                    {caretaker && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2">Profit Sharing with {caretaker.name}</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700">Owner's Share:</span>
                            <p className="font-semibold text-blue-900">{formatCurrency(ownerShare)}</p>
                          </div>
                          <div>
                            <span className="text-blue-700">Caretaker's Share ({caretaker.paymentModel.amount}%):</span>
                            <p className="font-semibold text-blue-900">{formatCurrency(caretakerShare)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'caretaker-earnings' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 transition-all duration-200 hover:shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Caretaker Earnings Summary</h3>
                <p className="text-sm text-gray-600 mt-1">Track caretaker performance and payments</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                  Export Report
                </button>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {caretakerEarnings.map((caretaker) => (
              <div key={caretaker.id} className="p-6 hover:bg-gray-50 transition-all duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={caretaker.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(caretaker.name)}
                          alt={caretaker.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          {caretaker.name}
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {caretaker.payment_type === 'percentage' ? 'Profit Share' : 'Fixed Rate'}
                          </span>
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <span>{caretaker.phone}</span>
                          {caretaker.email && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span>{caretaker.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                        <Users className="w-4 h-4 mr-1" />
                        {caretaker.goatsManaged} Goats Managed
                      </div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800">
                        <Target className="w-4 h-4 mr-1" />
                        {caretaker.payment_type === 'percentage' 
                          ? `${caretaker.payment_amount}% of profits`
                          : `${formatCurrency(caretaker.payment_amount)} per goat`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <div className="bg-white shadow-sm rounded-lg border border-gray-100 p-4 text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(caretaker.earnings)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        From {caretaker.goatsManaged} sales
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center transform transition-transform hover:scale-105">
                    <p className="text-2xl font-bold text-gray-900">{caretaker.assignedGoats?.length || 0}</p>
                    <p className="text-sm text-gray-600">Currently Assigned</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4 text-center transform transition-transform hover:scale-105">
                    <p className="text-2xl font-bold text-emerald-600">{caretaker.goatsManaged}</p>
                    <p className="text-sm text-gray-600">Successfully Sold</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center transform transition-transform hover:scale-105">
                    <p className="text-2xl font-bold text-blue-600">
                      {caretaker.goatsManaged > 0 ? formatCurrency(caretaker.earnings / caretaker.goatsManaged) : '₹0'}
                    </p>
                    <p className="text-sm text-gray-600">Average per Sale</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TransactionForm
        isOpen={isTransactionFormOpen}
        onClose={() => setIsTransactionFormOpen(false)}
      />
    </div>
  );
};