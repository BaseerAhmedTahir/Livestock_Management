import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Calendar, Users, Target } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TransactionForm } from '../Forms/TransactionForm';
import { useApp } from '../../context/AppContext';

export const FinanceManagement: React.FC = () => {
  const { goats, expenses, caretakers, healthRecords } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);

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
  const calculateGoatProfit = (goat: Goat) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Management</h2>
          <p className="text-gray-600">Track investments, expenses, and profitability</p>
        </div>
        <button 
          onClick={() => setIsTransactionFormOpen(true)}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Investment</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalInvestment)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.netProfit)}
              </p>
            </div>
            {metrics.netProfit >= 0 ? (
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-500" />
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Financial Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip formatter={(value, name) => [`₹${value.toLocaleString()}`, name]} />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="amount"
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Expense Records</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {expenses.map((expense) => {
              const goat = expense.goatId ? goats.find(g => g.id === expense.goatId) : null;
              const caretaker = expense.caretakerId ? caretakers.find(c => c.id === expense.caretakerId) : null;
              
              return (
                <div key={expense.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{expense.description}</h4>
                      <p className="text-sm text-gray-600">Category: {expense.category}</p>
                      {goat && (
                        <p className="text-sm text-gray-600">Goat: {goat.tagNumber} - {goat.nickname}</p>
                      )}
                      {caretaker && (
                        <p className="text-sm text-gray-600">Caretaker: {caretaker.name}</p>
                      )}
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{format(expense.date, 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-red-600">
                        -{formatCurrency(expense.amount)}
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Caretaker Earnings Summary</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {caretakerEarnings.map((caretaker) => (
              <div key={caretaker.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{caretaker.name}</h4>
                    <p className="text-sm text-gray-600">{caretaker.contactInfo.phone}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Payment Model: {caretaker.paymentModel.type === 'percentage' 
                        ? `${caretaker.paymentModel.amount}% profit sharing`
                        : `₹${caretaker.paymentModel.amount} fixed per goat`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-600">
                      {formatCurrency(caretaker.earnings)}
                    </p>
                    <p className="text-sm text-gray-600">
                      From {caretaker.goatsManaged} goats sold
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900">{caretaker.assignedGoats.length}</p>
                    <p className="text-gray-600">Total Assigned</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <p className="font-semibold text-emerald-600">{caretaker.goatsManaged}</p>
                    <p className="text-gray-600">Goats Sold</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-600">
                      {caretaker.goatsManaged > 0 ? (caretaker.earnings / caretaker.goatsManaged).toFixed(0) : '0'}
                    </p>
                    <p className="text-gray-600">Avg per Goat</p>
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