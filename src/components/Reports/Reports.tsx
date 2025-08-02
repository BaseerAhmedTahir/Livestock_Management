import React, { useState } from 'react';
import { Download, FileText, BarChart3, Calendar, Filter, Printer, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';
import { 
  ReportFilters, 
  filterDataByDateRange, 
  generateInventoryReport, 
  generateFinancialReport, 
  generateHealthReport, 
  generateCaretakerReport,
  generatePDFReport
} from '../../utils/reportGenerator';

export const Reports: React.FC = () => {
  const { goats, caretakers, expenses, healthRecords, weightRecords, loading, error } = useApp();
  const { activeBusiness } = useBusiness();
  const [selectedReport, setSelectedReport] = useState('inventory');
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month',
    reportType: 'inventory'
  });
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  // Generate report data when filters change
  React.useEffect(() => {
    if (!activeBusiness) return;
    
    const baseData = {
      goats,
      caretakers,
      healthRecords,
      weightRecords,
      expenses,
      business: activeBusiness,
      dateRange: { start: new Date(), end: new Date(), label: '' }
    };
    
    const currentFilters = {
      ...filters,
      reportType: selectedReport as any,
      startDate: customDateRange.start ? new Date(customDateRange.start) : undefined,
      endDate: customDateRange.end ? new Date(customDateRange.end) : undefined
    };
    
    const filteredData = filterDataByDateRange(baseData, currentFilters);
    
    let generatedReport;
    switch (selectedReport) {
      case 'inventory':
        generatedReport = generateInventoryReport(filteredData);
        break;
      case 'financial':
        generatedReport = generateFinancialReport(filteredData);
        break;
      case 'health':
        generatedReport = generateHealthReport(filteredData);
        break;
      case 'caretaker':
        generatedReport = generateCaretakerReport(filteredData, activeBusiness);
        break;
      default:
        generatedReport = generateInventoryReport(filteredData);
    }
    
    setReportData(generatedReport);
    setLastGenerated(new Date());
  }, [selectedReport, filters, customDateRange, goats, caretakers, expenses, healthRecords, weightRecords, activeBusiness]);

  const exportToPDF = async () => {
    if (!reportData || !activeBusiness) return;
    
    setIsExporting(true);
    try {
      const pdf = await generatePDFReport(reportData, selectedReport, activeBusiness);
      const fileName = `${activeBusiness.name.replace(/\s+/g, '-')}-${selectedReport}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !activeBusiness) return;
    
    let csvContent = '';
    
    switch (selectedReport) {
      case 'inventory':
        csvContent = generateInventoryCSV(reportData);
        break;
      case 'financial':
        csvContent = generateFinancialCSV(reportData);
        break;
      case 'health':
        csvContent = generateHealthCSV(reportData);
        break;
      case 'caretaker':
        csvContent = generateCaretakerCSV(reportData);
        break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBusiness.name.replace(/\s+/g, '-')}-${selectedReport}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateInventoryCSV = (data: any) => {
    const headers = ['Tag Number', 'Name', 'Breed', 'Gender', 'Status', 'Weight (kg)', 'Purchase Price', 'Sale Price'];
    const rows = goats.map(goat => [
      goat.tagNumber,
      goat.nickname || 'Unnamed',
      goat.breed,
      goat.gender,
      goat.status,
      goat.currentWeight,
      goat.purchasePrice,
      goat.salePrice || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateFinancialCSV = (data: any) => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Category'];
    const expenseRows = expenses.map(expense => [
      format(expense.date, 'yyyy-MM-dd'),
      'Expense',
      expense.description,
      expense.amount,
      expense.category
    ]);
    
    const salesRows = goats.filter(g => g.status === 'Sold' && g.salePrice).map(goat => [
      goat.saleDate ? format(goat.saleDate, 'yyyy-MM-dd') : '',
      'Sale',
      `Sale of ${goat.tagNumber}`,
      goat.salePrice || 0,
      'Revenue'
    ]);
    
    return [headers, ...expenseRows, ...salesRows].map(row => row.join(',')).join('\n');
  };

  const generateHealthCSV = (data: any) => {
    const headers = ['Date', 'Goat', 'Type', 'Description', 'Cost', 'Status', 'Next Due Date'];
    const rows = healthRecords.map(record => {
      const goat = goats.find(g => g.id === record.goatId);
      return [
        format(record.date, 'yyyy-MM-dd'),
        goat ? `${goat.tagNumber} - ${goat.nickname || 'Unnamed'}` : 'Unknown',
        record.type,
        record.description,
        record.cost,
        record.status,
        record.nextDueDate ? format(record.nextDueDate, 'yyyy-MM-dd') : ''
      ];
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateCaretakerCSV = (data: any) => {
    const headers = ['Name', 'Phone', 'Email', 'Assigned Goats', 'Active Goats', 'Sold Goats', 'Total Earnings'];
    const rows = data.caretakerPerformance.map((caretaker: any) => [
      caretaker.name,
      caretaker.contactInfo.phone,
      caretaker.contactInfo.email || '',
      caretaker.assignedGoats,
      caretaker.activeGoats,
      caretaker.soldGoats,
      caretaker.totalEarnings
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const handleDateRangeChange = (range: string) => {
    setFilters(prev => ({ ...prev, dateRange: range as any }));
  };

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    setCustomDateRange(prev => ({ ...prev, [field]: value }));
    if (filters.dateRange !== 'custom') {
      setFilters(prev => ({ ...prev, dateRange: 'custom' }));
    }
  };

  const refreshReport = () => {
    setLastGenerated(new Date());
    // Force re-render by updating a state that triggers useEffect
    setFilters(prev => ({ ...prev }));
  };

  const printReport = () => {
    window.print();
  };
      
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading reports: {error}</p>
        </div>
      </div>
    );
  }

  const reportTypes = [
    { 
      id: 'inventory', 
      name: 'Inventory Report', 
      description: 'Complete livestock inventory with current status',
      icon: '📊',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'financial', 
      name: 'Financial Summary', 
      description: 'Revenue, expenses, and profit analysis',
      icon: '💰',
      color: 'from-emerald-500 to-emerald-600'
    },
    { 
      id: 'caretaker', 
      name: 'Caretaker Performance', 
      description: 'Caretaker assignments and earnings',
      icon: '👥',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      id: 'health', 
      name: 'Health Summary', 
      description: 'Health records and upcoming treatments',
      icon: '🏥',
      color: 'from-red-500 to-red-600'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient">Reports & Analytics</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1 sm:mt-2 text-sm sm:text-base">Generate comprehensive reports for your livestock business</p>
          {lastGenerated && (
            <p className="text-sm text-neutral-500 mt-1">
              Last updated: {format(lastGenerated, 'MMM dd, yyyy at h:mm a')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* <button 
            onClick={refreshReport}
            className="btn-outline flex items-center flex-1 sm:flex-none justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button> */}
          <select
            value={filters.dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="input-field min-w-32 flex-1 sm:flex-none text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <button 
            onClick={exportToCSV}
            className="btn-outline flex items-center flex-1 sm:flex-none justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </button>
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="btn-primary flex items-center disabled:opacity-50 flex-1 sm:flex-none justify-center"
          >
            <Download className="h-5 w-5 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
          <button 
            onClick={printReport}
            className="btn-outline flex items-center flex-1 sm:flex-none justify-center"
          >
            <Printer className="h-5 w-5 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {filters.dateRange === 'custom' && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Custom Date Range</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  className="input-field text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="input-field text-base"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`group text-left p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              selectedReport === report.id
                ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 shadow-large'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-neutral-800 hover:shadow-medium'
            }`}
          >
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r ${report.color} flex items-center justify-center text-white text-lg mr-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-medium`}>
                {report.icon}
              </div>
              <FileText className={`h-4 w-4 sm:h-5 sm:w-5 ${
                selectedReport === report.id ? 'text-emerald-600' : 'text-gray-400'
              }`} />
            </div>
            <h3 className={`font-bold text-base sm:text-lg mb-2 ${
                selectedReport === report.id ? 'text-primary-900' : 'text-neutral-900'
              } dark:text-neutral-100`}>
                {report.name}
            </h3>
            <p className={`text-sm ${
              selectedReport === report.id ? 'text-primary-700' : 'text-neutral-600'
            } dark:text-neutral-400`}>
              {report.description}
            </p>
          </button>
        ))}
      </div>

      <div className="card animate-slide-up">
        {selectedReport === 'inventory' && (
          <>
            <div className="card-header">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Inventory Report</h3>
                <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  {reportData?.dateRange?.label} • Generated on {format(new Date(), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <div className="card-body">
            <div className="flex items-center justify-between mb-6">
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-700/50 shadow-soft">
                <p className="text-sm font-bold text-blue-600 dark:text-blue-300">Total Goats</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{reportData?.summary?.totalGoats || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl p-4 sm:p-6 border border-emerald-200 dark:border-emerald-700/50 shadow-soft">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">Active</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">{reportData?.summary?.activeGoats || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 rounded-2xl p-4 sm:p-6 border border-purple-200 dark:border-purple-700/50 shadow-soft">
                <p className="text-sm font-bold text-purple-600 dark:text-purple-300">Sold</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">{reportData?.summary?.soldGoats || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 rounded-2xl p-4 sm:p-6 border border-yellow-200 dark:border-yellow-700/50 shadow-soft">
                <p className="text-sm font-bold text-yellow-600 dark:text-yellow-300">Total Value</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-2">{formatCurrency(reportData?.summary?.totalValue || 0)}</p>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Breed Distribution</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {Object.entries(reportData?.breedBreakdown || {}).map(([breed, count]) => (
                  <div key={breed} className="bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-4 text-center border border-neutral-200 dark:border-neutral-600 hover:shadow-medium transition-all duration-300 hover:scale-105">
                    <p className="text-sm font-bold text-neutral-600 dark:text-neutral-300">{breed}</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{count as number}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Detailed Inventory</h4>
              <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Tag #</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Name</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Breed</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Weight</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                    {goats.map((goat) => (
                      <tr key={goat.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors duration-200">
                        <td className="px-4 sm:px-6 py-4 text-sm font-bold text-neutral-900 dark:text-neutral-100">{goat.tagNumber}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{goat.nickname || 'Unnamed'}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{goat.breed}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
                          <span className={`badge ${
                            goat.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                            goat.status === 'Sold' ? 'bg-blue-100 text-blue-800' :
                            goat.status === 'Deceased' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {goat.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{goat.currentWeight}kg</td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(goat.purchasePrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          </>
        )}

        {selectedReport === 'financial' && (
          <>
            <div className="card-header">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Financial Summary</h3>
                <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  {reportData?.dateRange?.label} • Generated on {format(new Date(), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <div className="card-body">
            <div className="flex items-center justify-between mb-6">
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 rounded-2xl p-4 sm:p-6 border border-purple-200 dark:border-purple-700/50 shadow-soft">
                <p className="text-sm font-bold text-purple-600 dark:text-purple-300">Total Investment</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">{formatCurrency(reportData?.summary?.totalInvestment || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl p-4 sm:p-6 border border-emerald-200 dark:border-emerald-700/50 shadow-soft">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">Total Revenue</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">{formatCurrency(reportData?.summary?.totalRevenue || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 rounded-2xl p-4 sm:p-6 border border-red-200 dark:border-red-700/50 shadow-soft">
                <p className="text-sm font-bold text-red-600 dark:text-red-300">Total Expenses</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 dark:text-red-100 mt-2">{formatCurrency(reportData?.summary?.totalExpenses || 0)}</p>
              </div>
              <div className={`rounded-xl p-6 border ${
                (reportData?.summary?.netProfit || 0) >= 0 
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200 dark:border-emerald-700/50' 
                  : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 border-red-200 dark:border-red-700/50'
              }`}>
                <p className={`text-sm font-medium ${
                  (reportData?.summary?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>Net Profit</p>
                <p className={`text-3xl font-bold mt-2 ${
                  (reportData?.summary?.netProfit || 0) >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'
                }`}>{formatCurrency(reportData?.summary?.netProfit || 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Recent Sales</h4>
                <div className="space-y-4">
                  {(reportData?.salesData || []).slice(0, 5).map((goat: any) => (
                    <div key={goat.id} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-600 hover:shadow-medium transition-all duration-300">
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">{goat.tagNumber} - {goat.nickname || 'Unnamed'}</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{goat.saleDate && format(goat.saleDate, 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(goat.salePrice || 0)}</p>
                        <p className={`text-sm ${goat.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {goat.profit >= 0 ? '+' : ''}{formatCurrency(goat.profit)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Expense Breakdown</h4>
                <div className="space-y-4">
                  {Object.entries(reportData?.expensesByCategory || {}).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-600 hover:shadow-medium transition-all duration-300">
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">{category}</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Category expenses</p>
                      </div>
                      <p className="font-bold text-red-600 dark:text-red-400">-{formatCurrency(amount as number)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </>
        )}

        {selectedReport === 'caretaker' && (
          <>
            <div className="card-header">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Caretaker Performance</h3>
                <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  {reportData?.dateRange?.label} • Generated on {format(new Date(), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <div className="card-body">
            <div className="flex items-center justify-between mb-6">
            </div>

            {/* Payment Model Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8 border border-blue-200 dark:border-blue-700">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Payment Model</h4>
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Type:</strong> {reportData?.paymentModel?.type === 'percentage' ? 'Percentage of Profit' : 'Monthly Fixed Amount'}
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Amount:</strong> {reportData?.paymentModel?.type === 'percentage' 
                  ? `${reportData?.paymentModel?.amount}% of net profit` 
                  : `₹${reportData?.paymentModel?.amount} per month`
                }
              </p>
            </div>

            <div className="space-y-6">
              {(reportData?.caretakerPerformance || []).map((caretaker: any) => (
                <div key={caretaker.id} className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-soft transition-shadow bg-white dark:bg-neutral-800">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {caretaker.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{caretaker.name}</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{caretaker.contactInfo.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(caretaker.totalEarnings)}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Earnings</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{caretaker.assignedGoats}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Total Assigned</p>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{caretaker.activeGoats}</p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Active</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">{caretaker.soldGoats}</p>
                      <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">Sold</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{formatCurrency(caretaker.averageEarningsPerGoat)}</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Avg per Goat</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </>
        )}

        {selectedReport === 'health' && (
          <>
            <div className="card-header">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Health Summary</h3>
                <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  {reportData?.dateRange?.label} • Generated on {format(new Date(), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <div className="card-body">
            <div className="flex items-center justify-between mb-6">
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-6 border border-emerald-200 dark:border-emerald-700">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">Total Records</p>
                <p className="text-3xl font-bold text-emerald-900 mt-2">{reportData?.summary?.totalRecords || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-300">Upcoming Treatments</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">{reportData?.summary?.upcomingTreatments || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Health Costs</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{formatCurrency(reportData?.summary?.totalHealthCosts || 0)}</p>
              </div>
            </div>

            {(reportData?.upcomingTreatments || []).length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4">Upcoming Treatments</h4>
                <div className="space-y-3">
                  {reportData.upcomingTreatments.slice(0, 10).map((treatment: any) => (
                    <div key={treatment.id} className="flex justify-between items-center bg-white dark:bg-neutral-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
                      <div>
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">{treatment.goatInfo}</span>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{treatment.type} - {treatment.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-yellow-600 dark:text-yellow-300">
                          {format(treatment.nextDueDate, 'MMM dd, yyyy')}
                        </span>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          {treatment.daysUntilDue} days
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};