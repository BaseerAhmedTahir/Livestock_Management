import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DashboardStats: React.FC = () => {
  const { goats, expenses, healthRecords, caretakers } = useApp();

  const totalGoats = goats.length;
  const activeGoats = goats.filter(g => g.status === 'Active');
  const soldGoats = goats.filter(g => g.status === 'Sold');

  const totalInvestment = goats.reduce((sum, goat) => sum + goat.purchasePrice, 0);
  const totalRevenue = goats
    .filter(g => g.salePrice)
    .reduce((sum, goat) => sum + (goat.salePrice || 0), 0);
  const careExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const healthExpenses = healthRecords.reduce((sum, record) => sum + record.cost, 0);
  const totalExpenses = careExpenses + healthExpenses;
  const netProfit = totalRevenue - totalInvestment - totalExpenses;

  // Calculate owner earnings (net profit minus caretaker shares)
  const calculateOwnerEarnings = () => {
    let totalCaretakerShares = 0;

    soldGoats.forEach(soldGoat => {
      const goat = goats.find(g => g.id === soldGoat.id);
      if (!goat || !goat.salePrice) return;

      const caretaker = goat.caretakerId
        ? caretakers.find(c => c.id === goat.caretakerId)
        : null;

      if (caretaker && caretaker.paymentModel.type === 'percentage') {
        // Calculate specific expenses for this goat
        const specificExpenses = expenses.filter(e => e.goatId === goat.id).reduce((sum, e) => sum + e.amount, 0);
        
        // Calculate shared expenses (expenses without specific goat assignment)
        const generalExpenses = expenses.filter(e => !e.goatId).reduce((sum, e) => sum + e.amount, 0);
        const activeGoats = goats.filter(g => g.status === 'Active');
        const totalActiveGoats = activeGoats.length;
        const sharedExpensePerGoat = totalActiveGoats > 0 ? generalExpenses / totalActiveGoats : 0;
        
        // Calculate health expenses for this goat
        const healthExpenses = healthRecords.filter(h => h.goatId === goat.id).reduce((sum, h) => sum + h.cost, 0);
        
        const totalGoatExpenses = specificExpenses + sharedExpensePerGoat + healthExpenses;
        const goatProfit = (goat.salePrice || 0) - goat.purchasePrice - totalGoatExpenses;

        const caretakerShare = (goatProfit * caretaker.paymentModel.amount) / 100;
        totalCaretakerShares += caretakerShare;
      }
    });

    return netProfit - totalCaretakerShares;
  };

  const ownerEarnings = calculateOwnerEarnings();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Calculate suggested sale value for active goats
  const suggestedSaleValue = activeGoats.reduce((sum, goat) => {
    const baseValue = goat.purchasePrice * 1.3; // 30% markup as base
    return sum + baseValue;
  }, 0);

  const stats = [
    {
      title: 'Total Goats',
      value: totalGoats.toString(),
      subtitle: `${activeGoats.length} active, ${soldGoats.length} sold`,
      icon: Users,
      color: 'bg-blue-500',
      trend: null
    },
    {
      title: 'Total Investment',
      value: formatCurrency(totalInvestment),
      subtitle: `+ ₹${(totalExpenses / 1000).toFixed(0)}k expenses`,
      icon: DollarSign,
      color: 'bg-purple-500',
      trend: null
    },
    {
      title: 'Revenue Generated',
      value: formatCurrency(totalRevenue),
      subtitle: `${soldGoats.length} goats sold`,
      icon: BarChart3,
      color: 'bg-emerald-500',
      trend: null
    },
    {
      title: 'Net Profit',
      value: formatCurrency(netProfit),
      subtitle: `${profitMargin.toFixed(1)}% margin`,
      icon: Target,
      color: netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500',
      trend: netProfit >= 0 ? 'up' : 'down'
    },
    {
      title: 'Owner Earnings',
      value: formatCurrency(ownerEarnings),
      subtitle: `After caretaker shares`,
      icon: DollarSign,
      color: ownerEarnings >= 0 ? 'bg-blue-500' : 'bg-red-500',
      trend: ownerEarnings >= 0 ? 'up' : 'down'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon =
          stat.trend === 'up'
            ? TrendingUp
            : stat.trend === 'down'
              ? TrendingDown
              : null;

        return (
          <div
            key={stat.title}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <div className="flex items-center">
                  <p className="text-sm text-gray-500">{stat.subtitle}</p>
                  {TrendIcon && (
                    <TrendIcon
                      className={`ml-2 h-4 w-4 ${
                        stat.trend === 'up'
                          ? 'text-emerald-500'
                          : 'text-red-500'
                      }`}
                    />
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
