import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { Goat, Caretaker, HealthRecord, WeightRecord, Expense, Business } from '../types';

export interface ReportData {
  goats: Goat[];
  caretakers: Caretaker[];
  healthRecords: HealthRecord[];
  weightRecords: WeightRecord[];
  expenses: Expense[];
  business: Business;
  dateRange: {
    start: Date;
    end: Date;
    label: string;
  };
}

export interface ReportFilters {
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  reportType: 'inventory' | 'financial' | 'caretaker' | 'health';
}

export const getDateRange = (range: string, customStart?: Date, customEnd?: Date) => {
  const now = new Date();
  
  switch (range) {
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      return {
        start: weekStart,
        end: now,
        label: 'Last 7 Days'
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'This Month'
      };
    case 'quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
      return {
        start: quarterStart,
        end: quarterEnd,
        label: 'This Quarter'
      };
    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
        label: 'This Year'
      };
    case 'custom':
      return {
        start: customStart || subMonths(now, 1),
        end: customEnd || now,
        label: 'Custom Range'
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'This Month'
      };
  }
};

export const filterDataByDateRange = (data: ReportData, filters: ReportFilters): ReportData => {
  const dateRange = getDateRange(filters.dateRange, filters.startDate, filters.endDate);
  
  return {
    ...data,
    dateRange,
    goats: data.goats.filter(goat => 
      isWithinInterval(goat.purchaseDate, { start: dateRange.start, end: dateRange.end }) ||
      (goat.saleDate && isWithinInterval(goat.saleDate, { start: dateRange.start, end: dateRange.end }))
    ),
    healthRecords: data.healthRecords.filter(record =>
      isWithinInterval(record.date, { start: dateRange.start, end: dateRange.end })
    ),
    weightRecords: data.weightRecords.filter(record =>
      isWithinInterval(record.date, { start: dateRange.start, end: dateRange.end })
    ),
    expenses: data.expenses.filter(expense =>
      isWithinInterval(expense.date, { start: dateRange.start, end: dateRange.end })
    )
  };
};

export const generateInventoryReport = (data: ReportData) => {
  const { goats, caretakers, dateRange } = data;
  
  const totalGoats = goats.length;
  const activeGoats = goats.filter(g => g.status === 'Active').length;
  const soldGoats = goats.filter(g => g.status === 'Sold').length;
  const deceasedGoats = goats.filter(g => g.status === 'Deceased').length;
  
  const breedBreakdown = goats.reduce((acc, goat) => {
    acc[goat.breed] = (acc[goat.breed] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const caretakerAssignments = caretakers.map(caretaker => ({
    ...caretaker,
    assignedCount: goats.filter(g => g.caretakerId === caretaker.id).length
  }));
  
  const totalValue = goats.reduce((sum, goat) => sum + goat.purchasePrice, 0);
  const averageWeight = goats.length > 0 
    ? goats.reduce((sum, goat) => sum + goat.currentWeight, 0) / goats.length 
    : 0;
  
  return {
    summary: {
      totalGoats,
      activeGoats,
      soldGoats,
      deceasedGoats,
      totalValue,
      averageWeight
    },
    breedBreakdown,
    caretakerAssignments,
    dateRange
  };
};

export const generateFinancialReport = (data: ReportData) => {
  const { goats, expenses, healthRecords, dateRange } = data;
  
  const totalInvestment = goats.reduce((sum, goat) => sum + goat.purchasePrice, 0);
  const totalRevenue = goats
    .filter(g => g.salePrice)
    .reduce((sum, goat) => sum + (goat.salePrice || 0), 0);
  
  const careExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const healthExpenses = healthRecords.reduce((sum, record) => sum + record.cost, 0);
  const totalExpenses = careExpenses + healthExpenses;
  
  const netProfit = totalRevenue - totalInvestment - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const salesData = goats
    .filter(g => g.status === 'Sold' && g.salePrice && g.saleDate)
    .map(goat => ({
      ...goat,
      profit: (goat.salePrice || 0) - goat.purchasePrice
    }));
  
  return {
    summary: {
      totalInvestment,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      roi
    },
    expensesByCategory,
    salesData,
    dateRange
  };
};

export const generateHealthReport = (data: ReportData) => {
  const { healthRecords, goats, dateRange } = data;
  
  const now = new Date();
  const upcomingTreatments = healthRecords
    .filter(record => record.nextDueDate && record.nextDueDate > now)
    .sort((a, b) => (a.nextDueDate?.getTime() || 0) - (b.nextDueDate?.getTime() || 0))
    .map(record => {
      const goat = goats.find(g => g.id === record.goatId);
      return {
        ...record,
        goatInfo: goat ? `${goat.tagNumber} - ${goat.nickname || 'Unnamed'}` : 'Unknown Goat',
        daysUntilDue: record.nextDueDate 
          ? Math.ceil((record.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0
      };
    });
  
  const healthStatusBreakdown = healthRecords.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const treatmentTypeBreakdown = healthRecords.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const totalHealthCosts = healthRecords.reduce((sum, record) => sum + record.cost, 0);
  
  return {
    summary: {
      totalRecords: healthRecords.length,
      upcomingTreatments: upcomingTreatments.length,
      totalHealthCosts
    },
    upcomingTreatments,
    healthStatusBreakdown,
    treatmentTypeBreakdown,
    dateRange
  };
};

export const generateCaretakerReport = (data: ReportData, business: Business) => {
  const { caretakers, goats, expenses, healthRecords, dateRange } = data;
  
  const caretakerPerformance = caretakers.map(caretaker => {
    const assignedGoats = goats.filter(g => g.caretakerId === caretaker.id);
    const activeGoats = assignedGoats.filter(g => g.status === 'Active');
    const soldGoats = assignedGoats.filter(g => g.status === 'Sold');
    
    // Calculate earnings based on business payment model
    let totalEarnings = 0;
    soldGoats.forEach(goat => {
      if (goat.salePrice) {
        const specificExpenses = expenses.filter(e => e.goatId === goat.id).reduce((sum, e) => sum + e.amount, 0);
        const healthExpenses = healthRecords.filter(h => h.goatId === goat.id).reduce((sum, h) => sum + h.cost, 0);
        const netProfit = goat.salePrice - goat.purchasePrice - specificExpenses - healthExpenses;
        
        if (business.paymentModelType === 'percentage') {
          totalEarnings += (netProfit * business.paymentModelAmount) / 100;
        } else {
          // Monthly payment model
          if (goat.saleDate && goat.purchaseDate) {
            const monthsUnderCare = Math.max(1, Math.floor((goat.saleDate.getTime() - goat.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
            totalEarnings += business.paymentModelAmount * monthsUnderCare;
          }
        }
      }
    });
    
    return {
      ...caretaker,
      assignedGoats: assignedGoats.length,
      activeGoats: activeGoats.length,
      soldGoats: soldGoats.length,
      totalEarnings,
      averageEarningsPerGoat: soldGoats.length > 0 ? totalEarnings / soldGoats.length : 0
    };
  });
  
  return {
    caretakerPerformance,
    paymentModel: {
      type: business.paymentModelType,
      amount: business.paymentModelAmount
    },
    dateRange
  };
};

export const generatePDFReport = async (reportData: any, reportType: string, business: Business) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Header
  pdf.setFillColor(16, 185, 129); // Primary green
  pdf.rect(0, 0, pageWidth, 25, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LivestockPro Report', 20, 16);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(business.name, pageWidth - 20, 16, { align: 'right' });
  
  // Report title and date
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 20, 40);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`, 20, 48);
  pdf.text(`Period: ${reportData.dateRange?.label || 'All Time'}`, 20, 54);
  
  let yPosition = 70;
  
  // Content based on report type
  switch (reportType) {
    case 'inventory':
      yPosition = addInventoryContent(pdf, reportData, yPosition, pageWidth);
      break;
    case 'financial':
      yPosition = addFinancialContent(pdf, reportData, yPosition, pageWidth);
      break;
    case 'health':
      yPosition = addHealthContent(pdf, reportData, yPosition, pageWidth);
      break;
    case 'caretaker':
      yPosition = addCaretakerContent(pdf, reportData, yPosition, pageWidth);
      break;
  }
  
  // Footer
  const footerY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Generated by LivestockPro Management System', pageWidth / 2, footerY, { align: 'center' });
  
  return pdf;
};

const addInventoryContent = (pdf: jsPDF, data: any, startY: number, pageWidth: number) => {
  let y = startY;
  
  // Summary section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Inventory Summary', 20, y);
  y += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Total Goats:', data.summary.totalGoats.toString()],
    ['Active Goats:', data.summary.activeGoats.toString()],
    ['Sold Goats:', data.summary.soldGoats.toString()],
    ['Deceased Goats:', data.summary.deceasedGoats.toString()],
    ['Total Value:', `₹${data.summary.totalValue.toLocaleString()}`],
    ['Average Weight:', `${data.summary.averageWeight.toFixed(1)}kg`]
  ];
  
  summaryData.forEach(([label, value]) => {
    pdf.text(label, 20, y);
    pdf.text(value, 80, y);
    y += 6;
  });
  
  y += 10;
  
  // Breed breakdown
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Breed Distribution', 20, y);
  y += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  Object.entries(data.breedBreakdown).forEach(([breed, count]) => {
    pdf.text(`${breed}:`, 20, y);
    pdf.text(count.toString(), 80, y);
    y += 6;
  });
  
  return y;
};

const addFinancialContent = (pdf: jsPDF, data: any, startY: number, pageWidth: number) => {
  let y = startY;
  
  // Financial summary
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Financial Summary', 20, y);
  y += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const financialData = [
    ['Total Investment:', `₹${data.summary.totalInvestment.toLocaleString()}`],
    ['Total Revenue:', `₹${data.summary.totalRevenue.toLocaleString()}`],
    ['Total Expenses:', `₹${data.summary.totalExpenses.toLocaleString()}`],
    ['Net Profit:', `₹${data.summary.netProfit.toLocaleString()}`],
    ['Profit Margin:', `${data.summary.profitMargin.toFixed(1)}%`],
    ['ROI:', `${data.summary.roi.toFixed(1)}%`]
  ];
  
  financialData.forEach(([label, value]) => {
    pdf.text(label, 20, y);
    pdf.text(value, 80, y);
    y += 6;
  });
  
  y += 10;
  
  // Expense breakdown
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Expense Breakdown', 20, y);
  y += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  Object.entries(data.expensesByCategory).forEach(([category, amount]) => {
    pdf.text(`${category}:`, 20, y);
    pdf.text(`₹${(amount as number).toLocaleString()}`, 80, y);
    y += 6;
  });
  
  return y;
};

const addHealthContent = (pdf: jsPDF, data: any, startY: number, pageWidth: number) => {
  let y = startY;
  
  // Health summary
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Health Summary', 20, y);
  y += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const healthData = [
    ['Total Health Records:', data.summary.totalRecords.toString()],
    ['Upcoming Treatments:', data.summary.upcomingTreatments.toString()],
    ['Total Health Costs:', `₹${data.summary.totalHealthCosts.toLocaleString()}`]
  ];
  
  healthData.forEach(([label, value]) => {
    pdf.text(label, 20, y);
    pdf.text(value, 80, y);
    y += 6;
  });
  
  y += 10;
  
  // Upcoming treatments
  if (data.upcomingTreatments.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Upcoming Treatments', 20, y);
    y += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    data.upcomingTreatments.slice(0, 10).forEach((treatment: any) => {
      pdf.text(`${treatment.goatInfo} - ${treatment.type}`, 20, y);
      pdf.text(`Due: ${format(treatment.nextDueDate, 'MMM dd, yyyy')}`, 120, y);
      pdf.text(`(${treatment.daysUntilDue} days)`, 170, y);
      y += 6;
    });
  }
  
  return y;
};

const addCaretakerContent = (pdf: jsPDF, data: any, startY: number, pageWidth: number) => {
  let y = startY;
  
  // Payment model info
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Payment Model', 20, y);
  y += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Type: ${data.paymentModel.type === 'percentage' ? 'Percentage' : 'Monthly Fixed'}`, 20, y);
  y += 6;
  pdf.text(`Amount: ${data.paymentModel.type === 'percentage' ? `${data.paymentModel.amount}%` : `₹${data.paymentModel.amount}`}`, 20, y);
  y += 15;
  
  // Caretaker performance
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Caretaker Performance', 20, y);
  y += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  data.caretakerPerformance.forEach((caretaker: any) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(caretaker.name, 20, y);
    y += 6;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Assigned Goats: ${caretaker.assignedGoats}`, 25, y);
    y += 5;
    pdf.text(`Active: ${caretaker.activeGoats} | Sold: ${caretaker.soldGoats}`, 25, y);
    y += 5;
    pdf.text(`Total Earnings: ₹${caretaker.totalEarnings.toLocaleString()}`, 25, y);
    y += 10;
  });
  
  return y;
};