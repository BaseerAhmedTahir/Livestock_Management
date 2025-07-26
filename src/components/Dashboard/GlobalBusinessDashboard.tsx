import React, { useState, useMemo } from 'react';
import { Building2, Users, DollarSign, TrendingUp, Eye, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Business } from '../../types';

interface BusinessSummary {
  business: Business;
  totalInvestment: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeGoats: number;
  soldGoats: number;
  totalGoats: number;
  caretakers: number;
}

interface GlobalBusinessDashboardProps {
  onSelectBusiness: (business: Business) => void;
  onBack: () => void;
}

export const GlobalBusinessDashboard: React.FC<GlobalBusinessDashboardProps> = ({ 
  onSelectBusiness, 
  onBack 
}) => {
  const { businesses, userRole } = useBusiness();
  const { user } = useAuth();
  const [businessSummaries, setBusinessSummaries] = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only allow owners to access this view
  if (userRole !== 'owner') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only business owners can access the global dashboard view.</p>
      </div>
    );
  }

  React.useEffect(() => {
    const fetchBusinessSummaries = async () => {
      if (!user || businesses.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const summaries: BusinessSummary[] = [];

        for (const business of businesses) {
          // Fetch goats data
          const { data: goatsData, error: goatsError } = await supabase
            .from('goats')
            .select('*')
            .eq('business_id', business.id);

          if (goatsError) throw goatsError;

          // Fetch expenses data
          const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('business_id', business.id);

          if (expensesError) throw expensesError;

          // Fetch health records data
          const { data: healthRecordsData, error: healthError } = await supabase
            .from('health_records')
            .select('*')
            .eq('business_id', business.id);

          if (healthError) throw healthError;

          // Fetch caretakers data
          const { data: caretakersData, error: caretakersError } = await supabase
            .from('caretakers')
            .select('*')
            .eq('business_id', business.id);

          if (caretakersError) throw caretakersError;

          // Calculate metrics
          const goats = goatsData || [];
          const expenses = expensesData || [];
          const healthRecords = healthRecordsData || [];
          const caretakers = caretakersData || [];

          const totalInvestment = goats.reduce((sum, goat) => sum + goat.purchase_price, 0);
          const totalRevenue = goats
            .filter(g => g.sale_price)
            .reduce((sum, goat) => sum + (goat.sale_price || 0), 0);
          const careExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
          const healthExpenses = healthRecords.reduce((sum, record) => sum + record.cost, 0);
          const totalExpenses = careExpenses + healthExpenses;
          const netProfit = totalRevenue - totalInvestment - totalExpenses;

          const activeGoats = goats.filter(g => g.status === 'Active').length;
          const soldGoats = goats.filter(g => g.status === 'Sold').length;

          summaries.push({
            business,
            totalInvestment,
            totalRevenue,
            totalExpenses,
            netProfit,
            activeGoats,
            soldGoats,
            totalGoats: goats.length,
            caretakers: caretakers.length
          });
        }

        setBusinessSummaries(summaries);
      } catch (err) {
        console.error('Error fetching business summaries:', err);
        setError(err instanceof Error ? err.message : 'Failed to load business data');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessSummaries();
  }, [user, businesses]);

  const globalTotals = useMemo(() => {
    return businessSummaries.reduce(
      (totals, summary) => ({
        totalInvestment: totals.totalInvestment + summary.totalInvestment,
        totalRevenue: totals.totalRevenue + summary.totalRevenue,
        totalExpenses: totals.totalExpenses + summary.totalExpenses,
        netProfit: totals.netProfit + summary.netProfit,
        activeGoats: totals.activeGoats + summary.activeGoats,
        soldGoats: totals.soldGoats + summary.soldGoats,
        totalGoats: totals.totalGoats + summary.totalGoats,
        caretakers: totals.caretakers + summary.caretakers
      }),
      {
        totalInvestment: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        activeGoats: 0,
        soldGoats: 0,
        totalGoats: 0,
        caretakers: 0
      }
    );
  }, [businessSummaries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const chartData = businessSummaries.map(summary => ({
    name: summary.business.name.length > 15 
      ? summary.business.name.substring(0, 15) + '...' 
      : summary.business.name,
    investment: summary.totalInvestment,
    revenue: summary.totalRevenue,
    profit: summary.netProfit,
    goats: summary.totalGoats
  }));

  const profitDistribution = businessSummaries.map((summary, index) => ({
    name: summary.business.name,
    value: Math.max(0, summary.netProfit),
    color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">All Businesses Overview</h2>
              <p className="text-gray-600">Loading business summaries...</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">All Businesses Overview</h2>
              <p className="text-gray-600">Error loading data</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Businesses Overview</h2>
            <p className="text-gray-600">Summary across {businesses.length} businesses</p>
          </div>
        </div>
      </div>

      {/* Global Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Total Investment</p>
              <p className="text-2xl font-bold">{formatCurrency(globalTotals.totalInvestment)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(globalTotals.totalRevenue)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Net Profit</p>
              <p className="text-2xl font-bold">{formatCurrency(globalTotals.netProfit)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Total Livestock</p>
              <p className="text-2xl font-bold">{globalTotals.totalGoats}</p>
            </div>
            <Users className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Business Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {businessSummaries.map((summary) => (
          <div key={summary.business.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{summary.business.name}</h3>
                  {summary.business.description && (
                    <p className="text-sm text-gray-600 truncate max-w-48">{summary.business.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => onSelectBusiness(summary.business)}
                className="flex items-center px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Investment</p>
                <p className="font-semibold text-gray-900">{formatCurrency(summary.totalInvestment)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="font-semibold text-emerald-600">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`font-semibold ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netProfit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ROI</p>
                <p className={`font-semibold ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {summary.totalInvestment > 0 ? ((summary.netProfit / summary.totalInvestment) * 100).toFixed(1) : '0'}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{summary.activeGoats}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-600">{summary.soldGoats}</p>
                <p className="text-xs text-gray-600">Sold</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-orange-600">{summary.caretakers}</p>
                <p className="text-xs text-gray-600">Caretakers</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {businessSummaries.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Performance Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
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
                  <Bar dataKey="investment" fill="#8b5cf6" name="Investment" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar dataKey="profit" fill="#f59e0b" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={profitDistribution.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {profitDistribution.map((entry, index) => (
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

      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Business Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Goats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caretakers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businessSummaries.map((summary) => (
                <tr key={summary.business.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{summary.business.name}</div>
                      {summary.business.description && (
                        <div className="text-sm text-gray-500">{summary.business.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(summary.totalInvestment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {formatCurrency(summary.netProfit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {summary.activeGoats}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {summary.soldGoats} goats
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {summary.caretakers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onSelectBusiness(summary.business)}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  📈 Totals ({businesses.length} businesses)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(globalTotals.totalInvestment)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={globalTotals.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {formatCurrency(globalTotals.netProfit)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {globalTotals.activeGoats}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {globalTotals.soldGoats} goats
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {globalTotals.caretakers}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};